import server from "../../dist/server/server.js";

export default async (req, context) => {
  return server.fetch(req, {}, context);
};
