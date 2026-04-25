export const sleep = async (timeMilliseconds: number) => {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      resolve(void 0);
    }, timeMilliseconds);
  });
};
