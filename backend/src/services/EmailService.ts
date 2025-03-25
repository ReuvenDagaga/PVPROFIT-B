import { Email } from "../interfaces/Email";
import { Emails } from "../models/Emails";

export const saveEmail = async (email: string): Promise<string> => {
    await Emails.create({ email });
    return email;
};

export const getAllEmails = async (): Promise<Email[]> => {
    const emails = await Emails.find()
    return emails;
};