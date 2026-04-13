
test("example", async () => {
  const { data } = await supabase.auth.signUp({
    email: "test1@gmail.com",
    password: "test1",
  });

  expect(data).toBeDefined();
});