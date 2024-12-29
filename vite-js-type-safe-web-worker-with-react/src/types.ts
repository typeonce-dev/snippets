export type WorkerMessage = {
  type: "feed.get";
  source: `https://${string}`;
};

export type WorkerResponse = {
  type: "feed.get";
  text: string;
};
