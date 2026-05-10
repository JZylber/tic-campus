const currentUserStore = () => ({
  id: null as number | null,
  name: null as string | null,
  surname: null as string | null,
  role: null as string | null,
  set(id: number, name: string | null, surname: string | null, role: string) {
    this.id = id;
    this.name = name;
    this.surname = surname;
    this.role = role;
  },
  clear() {
    this.id = null;
    this.name = null;
    this.surname = null;
    this.role = null;
  },
});

export type CurrentUserStore = ReturnType<typeof currentUserStore>;
export default currentUserStore;
