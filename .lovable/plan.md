

## Optimistic Updates for useTodos Mutations

### Problem
Every mutation (toggle, add, update, remove, drag-drop) waits for the edge function round-trip before updating the UI via `invalidateQueries`. This creates noticeable lag.

### Solution
Add **optimistic updates** to the key TanStack Query mutations using `onMutate` / `onError` / `onSettled`. The UI updates instantly by manipulating the query cache, then reconciles with the server response.

### Mutations to Update

All mutations in `src/hooks/useTodos.ts` that currently only use `onSuccess: invalidateQueries`:

1. **`toggleComplete`** — Flip `completed` and set `completed_at` in cache immediately
2. **`addTodo`** — Insert a temporary todo (with a generated UUID) into the cache
3. **`updateTodo`** — Merge updates into the cached todo immediately (covers drag-drop category change, text/notes/tags edits)
4. **`removeTodo`** — Remove the todo from the active cache immediately
5. **`archiveCompleted`** — Move completed todos from active cache to archived cache
6. **`restoreTodo`** — Move todo from archived cache back to active cache

### Pattern (same for each mutation)

```typescript
const toggleComplete = useMutation({
  mutationFn: async (...) => { ... },
  onMutate: async (variables) => {
    // 1. Cancel in-flight queries to avoid overwrites
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    // 2. Snapshot previous data
    const previous = queryClient.getQueryData(["todos", user?.id]);
    // 3. Optimistically update cache
    queryClient.setQueryData(["todos", user?.id], (old) => /* apply change */);
    // 4. Return rollback context
    return { previous };
  },
  onError: (_err, _vars, context) => {
    // Rollback on failure
    queryClient.setQueryData(["todos", user?.id], context?.previous);
    toast.error("Failed to update");
  },
  onSettled: () => {
    // Always refetch to reconcile
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

### Scope
- Only `src/hooks/useTodos.ts` changes
- No backend or database changes needed
- Image upload/delete and bulk operations keep their current behavior (not worth optimistic updates)

