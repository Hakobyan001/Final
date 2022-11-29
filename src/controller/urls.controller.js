import UrlService from '../services/UrlService';
// import { SuccessHandlerUtil } from '../utils';

export default class UrlsController {
  static async getAllUrls(req, res, next) {
    try {
      const { offset, limit } = req.params;
      const url = await UrlService.checkUrls(offset, limit);

      SuccessHandlerUtil.handleGet(res, next, url);

    } catch (error) {
      next(error);
    }
  }
}