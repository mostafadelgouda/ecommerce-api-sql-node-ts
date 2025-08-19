// import { NextFunction, Response } from "express";
// import { IRequest } from "../authentication";
// import { responseError } from "../helpers";
// import { Permissions } from "../models";
// import { ErrorKey } from "../resources";

// export function isAdmin(req: IRequest, res: Response, next: NextFunction) {
//   const currentUser = req.context.currentUser;
//   console.log("currentUser", currentUser);
//   if (!currentUser) {
//     return responseError(req, res, ErrorKey.UserNotExist, {
//       statusCode: 401,
//     });
//   }

//   let permissions: any = currentUser.permissions;
//   console.log("permissions", permissions);
//   if (!Array.isArray(permissions)) {
//     permissions = permissions ? permissions.split(",") : [];
//   }

//   if (permissions.includes(Permissions.Admin)) {
//     return next();
//   }

//   return responseError(req, res, ErrorKey.IsAdmin, {
//     statusCode: 401,
//   });
// }

// export function isSuperAdmin(req: IRequest, res: Response, next: NextFunction) {
//   const currentUser = req.context.currentUser;
//   if (!currentUser) {
//     return responseError(req, res, ErrorKey.UserNotExist, {
//       statusCode: 401,
//     });
//   }
//   let permissions: any = currentUser.permissions;
//   if (!Array.isArray(permissions)) {
//     permissions = permissions ? permissions.split(",") : [];
//   }

//   if (permissions.includes(Permissions.SuperAdmin)) {
//     return next();
//   }

//   return responseError(req, res, ErrorKey.IsAdmin, {
//     statusCode: 401,
//   });
// }
