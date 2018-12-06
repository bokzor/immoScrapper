const fs = require('fs');
export const debug = (log: string, ...params: any[]) => {
  console.log(log, ...params);
  fs.appendFile('debug.log', 'data to append',  () => {
  });
};
