// Standard modules
import http from 'http';
import 'dotenv/config';
import 'regenerator-runtime';

// Modules from this project
import cluster from 'cluster';
import { LoggerUtil } from '../utils';
import App from '../app';
import UrlService from '../services/UrlService';
import { UrlsModel } from '../models';
import db from '../../knex.config';
const knex = require('knex')(db.option);

// Constants
import config from '../config/variables.config';
import { name } from '../../package.json';

const { PORT } = config;

const init = async () => {
  const server = http.createServer(App.app);

  App.init();
  const _onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    const bind = typeof App.port === 'string' ? `Pipe ${App.port}` : `Port ${App.port}`;
    switch (error.code) {
      case 'EACCES':
        LoggerUtil.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        LoggerUtil.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };
  const _onListening = () => {
    const address = server.address();
    const bind = typeof address === 'string'
      ? `pipe ${address}`
      : `${address.port}`;

    LoggerUtil.info(`${name} started:`);
    LoggerUtil.info(`\tPort: ${bind}`);
    LoggerUtil.info(`\tEnvironment: ${App.env}`);
    LoggerUtil.info(`\tNode version: ${process.version}`);
    LoggerUtil.info(`\tStart date: ${(new Date()).toUTCString()} \n`);
  };
  server.listen(PORT);
  server.on('error', _onError);
  server.on('listening', _onListening);
};
const total_cpus = require('os').cpus().length;

let element = [];

let start = 0;
let end = 1;

async function isPrimary() {

  if (cluster.isPrimary) {

    const worker = cluster.fork();
    for (let i = 0; i < total_cpus - 1; i += 1) {
      cluster.fork();
    }

    

    cluster.on('online', async (worker) => {

      console.log(start, end);
      start++;
      end++;

      console.log(`Worker ${worker.process.pid} is online.`);

      const links = await UrlsModel.getUrls(start * 2000, end * 2000);

      for (let step = 0; step < links.length; step += 50) {
        element = links.slice(step, step + 50);
        worker.send(element);
      }

      worker.on('message', (msg) => {

        knex
          .from('links')
          .whereIn('id', msg.data[0])
          .update({ status: 'passive' })
          .then(() => {
            console.log('Table update');
          });
  
        knex
          .from('links')
          .whereIn('id', msg.data[1])
          .update({ status: 'active' })
          .then(() => {
            console.log('Table update');
          });
      });

    });

    cluster.on('exit', async (worker) => {
      console.log(end);
      console.log(`worker ${worker.process.pid} died.`);

      if (end <= 100) {
        cluster.fork();
        console.log('DIERY GNACCCCCCCCC!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      }
    });

  } else {
    process.on('message', async (msg) => {
      process.send({ data: await UrlService.checkUrls(msg) });
      process.kill(process.pid);
    });
  }
}

isPrimary();
