const redis = require("../../db/redis");

class ResearchStateRepository {

    async save(workflowId, state) {

        await redis.set(

            `workflow:${workflowId}`,

            JSON.stringify(state)

        );

    }

    async get(workflowId) {

        const value = await redis.get(

            `workflow:${workflowId}`

        );

        if (!value) {

            return null;

        }

        return JSON.parse(value);

    }

    async delete(workflowId) {

        await redis.del(

            `workflow:${workflowId}`

        );

    }

}

module.exports = {

    ResearchStateRepository

};