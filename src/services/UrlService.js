/* eslint-disable array-callback-return */
import fetch from 'node-fetch';
import PSQLStorage from '../storage/psql.storage';

import PSQL from '../config/variables.config';

const {
  PORT, HOST, DATABASE, USER, PASSWORD
} = PSQL.PSQL;

let arr = 0;
class UrlService {
  static async checkUrls(urls) {

    const items = urls.map((ur) => (`https://${ur.domain}`));
    const ids = urls.map((id) => id.id);
    const res = await Promise.allSettled(items.map((url) => fetch(url)));

    const fulfilledUrl = [];
    const rejectedUrl = [];
    for (let i = 0; i < ids.length; i += 1) {
      if (res[i].status !== 'fulfilled') {
        rejectedUrl.push(ids[i]);
      } else {
        fulfilledUrl.push(ids[i]);
      }
    }
    arr += fulfilledUrl.length + rejectedUrl.length;
    console.log(arr);
    console.log('fulfilled =>', fulfilledUrl);
    console.log('rejectedUrl =>', rejectedUrl);
    return [rejectedUrl, fulfilledUrl];
  }
  
}

export default UrlService;
