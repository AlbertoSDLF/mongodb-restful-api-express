import { NextFunction, Request, Response } from "express";
import * as HttpStatus from "http-status-codes";
import { Server } from "restify";
import EntityModel from "../model/entityModel";
import GenericController from "./genericController";

export default class GenericEntityController<T extends EntityModel> extends GenericController {
    private model: T;

    constructor(contextPath: string, model: T) {
        super(contextPath);
        this.model = model;
    }

    public add = (request: Request, response: Response, next: NextFunction): void => {
        const newEntity = this.model.getDbModel()(request.body);
        newEntity.save((error, createdEntity) => {
            if (error) {
                next(error);
                return;
            }
            response.status(HttpStatus.CREATED).json(createdEntity);
            next();
        });
    }

    public find = (request: Request, response: Response, next: NextFunction): void => {
        this.model.getDbModel().find({}, (error, foundEntities) => {
            if (error) {
                response.send(error);
            }
            response.json(foundEntities);
            next();
        });
    }

    public get = (request: Request, response: Response, next: NextFunction): void => {
        //        if (!response.headersSent) {
        this.model.getDbModel().findById(request.params.id, (error, retrievedEntity) => {
            if (error) {
                next(error);
                return;
            }
            if (retrievedEntity === null) {
                next(new Error(`EntityNotFound-${this.model.getName()}-${request.params.id}`));
                return;
            }
            response.status(HttpStatus.OK).json(retrievedEntity);
            next();
        });
        //        }
    }

    public update = (request: Request, response: Response, next: NextFunction): void => {
        this.model.getDbModel().findOneAndUpdate({ _id: request.params.id },
            request.body, { new: true }, (error, updatedEntity) => {
                if (error) {
                    response.send(error);
                }
                response.json(updatedEntity);
                next();
            });
    }

    public delete = (request: Request, response: Response, next: NextFunction): void => {
        this.model.getDbModel().remove({ _id: request.params.id }, (error, deletedEntity) => {
            if (error) {
                response.send(error);
            }
            response.json({ message: "Successfully deleted entity!" });
            next();
        });
    }

    public createRoutes(server: Server): void {
        server.get(this.contextPath, this.find);
        server.post(this.contextPath, this.add);
        server.get(`${this.contextPath}/:id`, this.get);
        server.put(`${this.contextPath}/:id`, this.update);
        server.del(`${this.contextPath}/:id`, this.delete);
    }
}