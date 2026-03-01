import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, RefreshCw, Users, ListTodo, CalendarDays, CalendarRange, CalendarClock, LayoutList, CalendarIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type StatsSummary = {
  total_users: number;
  total_todos: number;
  todos_today_count: number;
  todos_this_week_count: number;
  todos_next_week_count: number;
  todos_others_count: number;
  computed_at: string;
};

type DailyStat = {
  stat_date: string;
  unique_users: number;
  todos_created: number;
  todos_completed: number;
};

async function invokeAdmin(action: string) {
  const { data, error } = await supabase.functions.invoke("admin-api", { body: { action } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function Admin() {
  const { isAdmin, isLoading } = useAdminCheck();
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchStats = async () => {
    const [summaryData, dailyData] = await Promise.all([
      invokeAdmin("get_summary"),
      invokeAdmin("get_daily"),
    ]);
    if (summaryData) setSummary(summaryData as StatsSummary);
    if (dailyData) setDaily(dailyData as DailyStat[]);
  };

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await invokeAdmin("refresh");
      await fetchStats();
      toast({ title: "Stats refreshed" });
    } catch (e: any) {
      toast({ title: "Error refreshing stats", description: e.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const chartDaily = useMemo(() => {
    const from = format(dateFrom, "yyyy-MM-dd");
    const to = format(dateTo, "yyyy-MM-dd");
    return daily
      .filter((d) => d.stat_date >= from && d.stat_date <= to)
      .map((d) => ({
        ...d,
        date: new Date(d.stat_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      }));
  }, [daily, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const usersChartConfig = {
    unique_users: { label: "Unique Users", color: "hsl(var(--primary))" },
  };

  const todosChartConfig = {
    todos_created: { label: "Created", color: "hsl(var(--accent))" },
    todos_completed: { label: "Completed", color: "hsl(var(--primary))" },
  };

  const summaryCards = summary
    ? [
        { title: "Total Users", value: summary.total_users, icon: Users },
        { title: "Total Todos", value: summary.total_todos, icon: ListTodo },
        { title: "Today", value: summary.todos_today_count, icon: CalendarDays },
        { title: "This Week", value: summary.todos_this_week_count, icon: CalendarRange },
        { title: "Next Week", value: summary.todos_next_week_count, icon: CalendarClock },
        { title: "Others", value: summary.todos_others_count, icon: LayoutList },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Stats
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {summary && (
          <p className="text-xs text-muted-foreground">
            Last computed: {new Date(summary.computed_at).toLocaleString()}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Date range:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-4 w-4 mr-1" />
                {format(dateFrom, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <span className="text-sm text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-4 w-4 mr-1" />
                {format(dateTo, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <div className="flex gap-1 ml-2">
            {[7, 14, 30, 90].map((days) => (
              <Button key={days} variant="ghost" size="sm" onClick={() => { setDateFrom(subDays(new Date(), days)); setDateTo(new Date()); }}>
                {days}d
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unique Users per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={usersChartConfig} className="h-[300px] w-full">
              <BarChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="unique_users" fill="var(--color-unique_users)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Todos Created vs Completed per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={todosChartConfig} className="h-[300px] w-full">
              <LineChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="todos_created" stroke="var(--color-todos_created)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="todos_completed" stroke="var(--color-todos_completed)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
