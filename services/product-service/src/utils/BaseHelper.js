import _ from "lodash";
import AppError from "../handlers/AppError.js";
import logger from "../logs/logger.js";

class BaseHelper {
    constructor(model) {
        this.model = model;
    }

    // ------------------------------
    // CREATE
    // ------------------------------
    async addObject(obj) {
        try {
            const newObj = new this.model(obj);
            return await newObj.save();
        } catch (error) {
            logger.error("Add Object Error", error);
            throw new AppError(error.message || "Failed to add object", 400);
        }
    }

    // ------------------------------
    // GET BY ID
    // ------------------------------
    async getObjectById(filters) {
        try {
            const { id, selectFrom = {}, populatedQuery = null } = filters;

            let query = this.model.findById(id).select(selectFrom);

            if (populatedQuery) query = query.populate(populatedQuery);

            const result = await query.lean().exec();

            if (!result) throw new AppError("Object not found", 404);

            return result;
        } catch (error) {
            logger.error("Get Object By ID Error", error);
            throw new AppError(error.message || "Failed to get object", 400);
        }
    }

    // ------------------------------
    // GET BY QUERY
    // ------------------------------
    async getObjectByQuery(filters) {
        try {
            let result;
            if (filters.populatedQuery) {
                result = await this.model
                    .findOne(filters.query)
                    .select(filters.selectFrom || {})
                    .populate(filters.populatedQuery || {})
                    .lean()
                    .exec();
            } else {
                result = await this.model
                    .findOne(filters.query)
                    .select(filters.selectFrom || {})
                    .lean()
                    .exec();
            }


            return result;
        } catch (error) {
            logger.error("Get Object By Query Error", error);
            throw new AppError("Failed to fetch object", 400);
        }
    }

    // ------------------------------
    // UPDATE BY ID
    // ------------------------------
    async updateObject(objectId, updateObject) {
        try {
            const updated = await this.model.findByIdAndUpdate(
                objectId,
                updateObject,
                { new: true, runValidators: true }
            );

            if (!updated) throw new AppError("Object not found", 404);

            return updated;
        } catch (error) {
            logger.error("Update Object Error", error);
            throw new AppError(error.message || "Failed to update", 400);
        }
    }

    // ------------------------------
    // UPDATE BY QUERY
    // ------------------------------
    async updateObjectByQuery(query, updateObject) {
        try {
            const updated = await this.model.findOneAndUpdate(query, updateObject, {
                new: true,
                runValidators: true,
            });

            if (!updated) throw new AppError("Object not found", 404);

            return updated;
        } catch (error) {
            logger.error("Update Object by Query Error", error);
            throw new AppError(error.message || "Failed to update", 400);
        }
    }

    // ------------------------------
    // DIRECT UPDATE
    // ------------------------------
    async directUpdateObject(objectId, updateObject) {
        try {
            return await this.model.findByIdAndUpdate(objectId, updateObject, {
                new: true,
            });
        } catch (error) {
            logger.error("Direct Update Error", error);
            throw new AppError("Failed to update", 400);
        }
    }

    // ------------------------------
    // DELETE BY ID
    // ------------------------------
    async deleteObjectById(objectId) {
        try {
            const deleted = await this.model.findByIdAndDelete(objectId);
            if (!deleted) throw new AppError("Object not found", 404);
            return deleted;
        } catch (error) {
            logger.error("Delete Error", error);
            throw new AppError("Failed to delete", 400);
        }
    }

    // ------------------------------
    // DELETE BY QUERY
    // ------------------------------
    async deleteObjectByQuery(query) {
        try {
            return await this.model.findOneAndDelete(query);
        } catch (error) {
            logger.error("Delete by Query Error", error);
            throw new AppError("Failed to delete", 400);
        }
    }

    // ------------------------------
    // INSERT MANY
    // ------------------------------
    async insertMany(data) {
        try {
            return await this.model.insertMany(data);
        } catch (error) {
            logger.error("Insert Many Error", error);
            throw new AppError("Failed to insert many", 400);
        }
    }

    // ------------------------------
    // DELETE MANY
    // ------------------------------
    async deleteManyByQuery(query) {
        try {
            return await this.model.deleteMany(query);
        } catch (error) {
            logger.error("Delete Many Error", error);
            throw new AppError("Failed to delete many", 400);
        }
    }

    // ------------------------------
    // BULK WRITE
    // ------------------------------
    async bulkWrite(data) {
        try {
            return await this.model.bulkWrite(data);
        } catch (error) {
            logger.error("Bulk Write Error", error);
            throw new AppError("Failed bulk write", 400);
        }
    }

    // ------------------------------
    // GET ALL (WITH PAGINATION)
    // ------------------------------
    async getAllObjects(filters) {
        try {
            const {
                query = {},
                selectFrom = {},
                sortBy = { _id: 1 },
                pageNum = 1,
                pageSize = 50,
                skip = (pageNum - 1) * pageSize,
                populatedQuery = null,
            } = filters;

            let dbQuery = this.model
                .find(query)
                .select(selectFrom)
                .sort(sortBy)
                .skip(skip)
                .limit(pageSize);

            if (populatedQuery) dbQuery = dbQuery.populate(populatedQuery);

            return await dbQuery.lean().exec();
        } catch (error) {
            logger.error("Get All Objects Error", error);
            throw new AppError("Failed fetching objects", 400);
        }
    }

    // ------------------------------
    // GET COUNT
    // ------------------------------
    async getAllObjectCount(filters) {
        try {
            return await this.model.countDocuments(filters.query || {});
        } catch (error) {
            logger.error("Count Error", error);
            throw new AppError("Failed to count objects", 400);
        }
    }

    // ------------------------------
    // AGGREGATION
    // ------------------------------
    async aggregate(steps) {
        try {
            return await this.model.aggregate(steps).exec();
        } catch (error) {
            logger.error("Aggregate Error", error);
            throw new AppError("Failed aggregation", 400);
        }
    }
}

export default BaseHelper;
