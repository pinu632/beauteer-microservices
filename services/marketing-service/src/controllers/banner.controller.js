
import Banner from '../models/Banner.js';

export const createBanner = async (req, res) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json({ status: 'success', data: banner });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllBanners = async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const banners = await Banner.find(query).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: banners });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.status(200).json({ status: 'success', data: banner });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.status(200).json({ status: 'success', data: banner });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.status(200).json({ status: 'success', message: 'Banner deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
