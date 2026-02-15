
import Campaign from '../models/Campaign.js';
import { publishToQueue } from '../utils/rabbitmq.js';

export const createCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.create(req.body);

        if (campaign.platform === 'NOTIFICATION' || campaign.platform === 'ALL') {
            await publishToQueue("notification_queue", {
                event: "CAMPAIGN_NOTIFICATION",
                data: campaign
            });
        }

        res.status(201).json({ status: 'success', data: campaign });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllCampaigns = async (req, res) => {
    try {
        const { isActive, type } = req.query;
        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (type) query.type = type;

        const campaigns = await Campaign.find(query).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: campaigns });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndDelete(req.params.id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        res.status(200).json({ status: 'success', message: 'Campaign deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
