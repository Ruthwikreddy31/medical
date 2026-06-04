export const User = {
  collection: "users",
  indexes: [{ key: { email: 1 }, unique: true }]
};
