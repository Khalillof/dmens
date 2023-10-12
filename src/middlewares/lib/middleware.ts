import express from 'express';
import { isValidRole, Svc, responce, envs } from '../../common/index.js';
import { IMiddlewares } from '../../interfaces/index.js';
import { uploadSchema } from '../../routes/index.js';
import fs from 'fs';
import { authenticateUser } from '../../services/index.js';

class Middlewares implements IMiddlewares {

  authenticate = authenticateUser(envs.authStrategy());


  async getUserFromReq(req: express.Request) {
    return req.body && req.body.email ? await Svc.db.get('account')!.findOne({ email: req.body.email }) : null;
  }
  checkLoginUserFields(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.body) {
      let { email, username, password } = req.body;
      if (!username && email) { req.body.username = email };
      if (!email && username) { req.body.email = username };

      if (req.body.email && req.body.password) {
        next();
        return;
      }
    }
    responce(res).badRequest('Missing required body fields')
    return;
  }

  async validateSameEmailDoesntExist(req: express.Request, res: express.Response, next: express.NextFunction) {
    await this.getUserFromReq(req) ? responce(res).badRequest('User email already exists') : next();
  }

  validateCurrentUserOwnParamId(req: any, res: express.Response, next: express.NextFunction) {
    req.user && String(req.user._id) === String(req.params['id']) ? next() : responce(res).unAuthorized();
  }
  validateBodyEmailBelongToCurrentUser(req: any, res: express.Response, next: express.NextFunction) {
    (req.user && req.body.email === req.user.email) ? next() : responce(res).unAuthorized();
  }
  validateHasQueryEmailBelongToCurrentUser(req: any, res: express.Response, next: express.NextFunction) {
    (req.user && req.query.email === req.user.email) ? next() : responce(res).forbidden('not authorized, require valid email');
  }

  async userExist(req: express.Request, res: express.Response, next: express.NextFunction) {
    await this.getUserFromReq(req) ? next() : responce(res).forbidden('User does not exist : ' + req.body.email);
  }
  async uploadSchema(req: any, res: express.Response, next: express.NextFunction) {
    return uploadSchema

  }

  isAuthenticated(req: any, res: express.Response, next: express.NextFunction) {
    req.isAuthenticated() ? next() : responce(res).unAuthorized();

  }

  async isAdmin(req: any, res: express.Response, next: express.NextFunction) {
    return this.isInRole('admin');

  }
  // roles
  isRolesExist(roles: string[]) {
    if (roles) {
      for (let r of roles) {
        if (!isValidRole(r)) {
          return false;
        }
      }
    }
    return true;

  };


  isInRole(roleName: string) {
    let db = Svc.db.get('account')!;
    return async (req: any, res: express.Response, next: express.NextFunction) => {
      if (!req.isAuthenticated()) {
        responce(res).forbidden('require authentication')
        return;
      }
      let reqUser: any = req.user && req.user.roles ? req.user : await db.findById(req.user._id);

      let roles = await db.model!.find({ _id: { $in: reqUser.roles } });

      if (roles) {
        for (let r of roles) {
          if (r.name === roleName) {
            next();
            return;
          }
        }

      }

      responce(res).forbidden("Require Admin Role!");

      return;
    }
  }

  isJson(req: express.Request, res: express.Response, next: express.NextFunction): void {

    const toJsonNext = (data: any) => {
      req.body = JSON.parse(data);
      next()
    }

    if (req.body && req.header('content-type') === 'application/json') {
      // toJsonNext(req.body);
      next();
    } else if (req.file && req.file.mimetype === 'application/json') {

      fs.readFile(req.file.path, 'utf8', (err: any, data: any) => {
        if (err) {
          responce(res).error(err);
        } else {
          toJsonNext(data);
        }
      });
    } else {

      responce(res).badRequest('content must be valid application/json');
    }
  }
}
export default new Middlewares();