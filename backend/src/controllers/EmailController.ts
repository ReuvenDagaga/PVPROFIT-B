import { Request, Response } from "express";
import * as EmailService from "../services/EmailService";


export const saveEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const savedEmail = await EmailService.saveEmail(email);
        res.status(200).json({ success: true, data: savedEmail });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

export const getAllEmails = async (req: Request, res: Response): Promise<void> => {
    try {
        const emails = await EmailService.getAllEmails();
        res.status(200).json({ success: true, data: emails });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}