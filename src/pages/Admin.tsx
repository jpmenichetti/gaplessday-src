import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, RefreshCw, Users, ListTodo, CalendarDays, CalendarRange, CalendarClock, LayoutList } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { useToast } from "@/hooks/use-toast";

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

export default function Admin() {
  const { isAdmin, isLoading } = useAdminCheck();
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    const [summaryRes, dailyRes] = await Promise.all([
      supabase.from("admin_stats_summary").select("*").eq("id", 1).single(),
      supabase.from("admin_stats_daily").select("*").order("stat_date", { ascending: true }),
    ]);
    if (summaryRes.data) setSummary(summaryRes.data as unknown as StatsSummary);
    if (dailyRes.data) setDaily(dailyRes.data as unknown as DailyStat[]);
  };

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("compute-stats");
      if (error) throw error;
      await fetchStats();
      toast({ title: "Stats refreshed" });
    } catch (e: any) {
      toast({ title: "Error refreshing stats", description: e.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const chartDaily = daily.map((d) => ({
    ...d,
    date: new Date(d.stat_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

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

        {/* Summary Cards */}
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

        {/* Unique Users per Day */}
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

        {/* Todos Created vs Completed */}
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
