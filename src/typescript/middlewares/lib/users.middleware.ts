import express from 'express';
import {JsonModel} from '../../models'
import { AuthService } from '../../services/lib/auth.service'
import { dbStore } from '../../common';

export class UsersMiddleware {
    db: JsonModel;
    auth = AuthService;
    constructor() {
        this.db = dbStore['account'];
    }

    static async createInstance() {
        return await Promise.resolve(new UsersMiddleware())
    }

  async  getUserFromReq(req:express.Request){
        return req.body && req.body.email ? await this.db.getOneByQuery({email:req.body.email}) : null;
    }
    validateRequiredUserBodyFields(req: express.Request, res: express.Response, next: express.NextFunction){
            if ( req.body.email || req.body.username && req.body.password) {
                next();
            } else {
                res.json({success:false, error:'Missing required body fields'})
            }
    }

 async validateSameEmailDoesntExist (req: express.Request, res: express.Response, next: express.NextFunction){
          await  this.getUserFromReq(req) ? res.status(400).json({ success:false, error: `User email already exists` }) : next();
    }

   async validateSameEmailBelongToSameUser(req: express.Request, res: express.Response, next: express.NextFunction){
            const user = await this.getUserFromReq(req)
            user && user._id === req.params.id ? next() : res.status(400).json({ error: `Invalid email` });
    }

    // Here we need to use an arrow function to bind `this` correctly
  async  validatePatchEmail(req: express.Request, res: express.Response, next: express.NextFunction){
           req.body && req.body.email ? await  this.validateSameEmailBelongToSameUser(req, res, next): next();
    }

  async  validateUserExists(req: express.Request, res: express.Response, next: express.NextFunction){
       await  this.getUserFromReq(req) ? next() : res.status(404).json({ error: 'User does not exist : ' +req.body.email });
    }
    
    verifyUserIsAdmin(req: any, res: express.Response, next: express.NextFunction){
            req.user && req.user.admin && req.isAuthenticated ? next() : res.status(400).json({success:false,error:'you are not authorized'})
  
    }
    userIsAuthenticated(req: any, res: express.Response, next: express.NextFunction){
        req.user && req.isAuthenticated ? next() : res.status(400).json({success:false,error:'you are not authorized'})

}

    extractUserId(req: express.Request, res: express.Response, next: express.NextFunction) {
        req.body.id = req.params.id;
        next();
    }

}