import SupportAgent from '../models/SupportAgent.js';

export const createAgent = async (req, res) => {
    try {
        const agent = new SupportAgent(req.body);
        await agent.save();
        res.status(201).json(agent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAgents = async (req, res) => {
    try {
        const agents = await SupportAgent.find();
        res.json(agents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateAgentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const agent = await SupportAgent.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(agent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
