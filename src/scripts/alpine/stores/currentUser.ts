// Only the role is kept: it's all the dashboard nav needs to decide what to show.
const currentUserStore = () => ({
  role: null as string | null,
});

export type CurrentUserStore = ReturnType<typeof currentUserStore>;
export default currentUserStore;
