import cron from 'node-cron';
import mongoose from 'mongoose';
import { FollowUp } from '../modules/followups/followup.model';
import { Notification } from '../modules/notifications/notification.model';
import { sendMail } from '../utils/sendMail';
import { logger } from '../config/logger';

// ── Job 1: Mark overdue follow-ups as MISSED (runs every hour) ─────────────────
export const markMissedFollowUpsJob = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();

            const missed = await FollowUp.updateMany(
                {
                    scheduledAt: { $lt: now },
                    status:      { $in: ['SCHEDULED', 'PENDING'] },
                },
                {
                    $set: { status: 'MISSED' },
                }
            );

            if (missed.modifiedCount > 0) {
                logger.info(`[FollowUp Job] Marked ${missed.modifiedCount} follow-ups as MISSED`);
            }
        } catch (error) {
            logger.error('[FollowUp Job] Error marking missed follow-ups:', error);
        }
    });
};

// ── Job 2: Send reminders for follow-ups due in the next 2 hours (runs every 30 min) ──
export const sendFollowUpRemindersJob = () => {
    cron.schedule('*/30 * * * *', async () => {
        try {
            const now       = new Date();
            const twoHours  = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            // Find due follow-ups where reminder not yet sent
            const dueSoon = await FollowUp.find({
                scheduledAt:  { $gte: now, $lte: twoHours },
                status:       { $in: ['SCHEDULED', 'PENDING'] },
                reminderSent: false,
            })
                .populate<{ assignedTo: { _id: mongoose.Types.ObjectId; name: string; email: string } }>(
                    'assignedTo', 'name email'
                )
                .populate<{ lead: { _id: mongoose.Types.ObjectId; name: string; phone: string } }>(
                    'lead', 'name phone'
                );

            if (dueSoon.length === 0) return;

            logger.info(`[FollowUp Job] Sending reminders for ${dueSoon.length} upcoming follow-ups`);

            for (const followUp of dueSoon) {
                const executive = followUp.assignedTo as any;
                const lead      = followUp.lead as any;

                if (!executive || !lead) continue;

                // In-app notification
                await Notification.create({
                    userId:   executive._id,
                    title:    `Reminder: ${followUp.type} Follow-Up Due Soon`,
                    message:  `You have a ${followUp.type} follow-up with ${lead.name} (${lead.phone}) scheduled at ${new Date(followUp.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Don't miss it!`,
                    type:     'FollowUp',
                    refId:    followUp._id as mongoose.Types.ObjectId,
                    refModel: 'FollowUp',
                });

                // Email notification
                if (executive.email) {
                    await sendMail({
                        to:      executive.email,
                        subject: `Reminder: ${followUp.type} Follow-Up with ${lead.name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #1B3A5C; padding: 20px; border-radius: 8px 8px 0 0;">
                                    <h2 style="color: white; margin: 0;">Follow-Up Reminder</h2>
                                </div>
                                <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
                                    <p style="font-size: 16px;">Hi <strong>${executive.name}</strong>,</p>
                                    <p>This is a reminder for your upcoming follow-up:</p>
                                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                                        <tr style="background: #e8f0fe;">
                                            <td style="padding: 10px; font-weight: bold;">Lead</td>
                                            <td style="padding: 10px;">${lead.name} — ${lead.phone}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px; font-weight: bold;">Type</td>
                                            <td style="padding: 10px;">${followUp.type}</td>
                                        </tr>
                                        <tr style="background: #e8f0fe;">
                                            <td style="padding: 10px; font-weight: bold;">Scheduled At</td>
                                            <td style="padding: 10px;">${new Date(followUp.scheduledAt).toLocaleString('en-IN')}</td>
                                        </tr>
                                        ${followUp.notes ? `
                                        <tr>
                                            <td style="padding: 10px; font-weight: bold;">Notes</td>
                                            <td style="padding: 10px;">${followUp.notes}</td>
                                        </tr>` : ''}
                                    </table>
                                    <p style="color: #666; font-size: 13px;">Rising Spaces CRM</p>
                                </div>
                            </div>
                        `,
                    });
                }

                // Mark reminder as sent
                await FollowUp.findByIdAndUpdate(followUp._id, {
                    $set: {
                        reminderSent:   true,
                        reminderSentAt: new Date(),
                    },
                });
            }

            logger.info(`[FollowUp Job] Reminders sent for ${dueSoon.length} follow-ups`);

        } catch (error) {
            logger.error('[FollowUp Job] Error sending reminders:', error);
        }
    });
};

// ── Job 3: Daily morning summary to each executive (runs at 8:00 AM every day) ──
export const dailyFollowUpSummaryJob = () => {
    cron.schedule('0 8 * * *', async () => {
        try {
            const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
            const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

            // Get today's follow-ups grouped by executive
            const todaysFollowUps = await FollowUp.find({
                scheduledAt: { $gte: todayStart, $lte: todayEnd },
                status:      { $in: ['SCHEDULED', 'PENDING'] },
            })
                .populate<{ assignedTo: { _id: mongoose.Types.ObjectId; name: string; email: string } }>(
                    'assignedTo', 'name email'
                )
                .populate<{ lead: { name: string; phone: string } }>(
                    'lead', 'name phone'
                );

            if (todaysFollowUps.length === 0) return;

            // Group by executive
            const byExecutive: Record<string, {
                executive: { _id: mongoose.Types.ObjectId; name: string; email: string };
                followUps: typeof todaysFollowUps;
            }> = {};

            for (const fu of todaysFollowUps) {
                const exec = fu.assignedTo as any;
                if (!exec) continue;
                const id = exec._id.toString();
                if (!byExecutive[id]) {
                    byExecutive[id] = { executive: exec, followUps: [] };
                }
                byExecutive[id].followUps.push(fu);
            }

            // Send to each executive
            for (const { executive, followUps } of Object.values(byExecutive)) {
                const count = followUps.length;

                // In-app notification
                await Notification.create({
                    userId:   executive._id,
                    title:    `Good Morning! You have ${count} follow-up${count > 1 ? 's' : ''} today`,
                    message:  `Today's schedule: ${followUps.map((f: any) => `${f.type} with ${(f.lead as any)?.name}`).join(', ')}.`,
                    type:     'FollowUp',
                    refId:    executive._id,
                    refModel: 'User',
                });

                // Email summary
                if (executive.email) {
                    const rows = followUps.map((f: any) => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${(f.lead as any)?.name} — ${(f.lead as any)?.phone}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${f.type}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(f.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                    `).join('');

                    await sendMail({
                        to:      executive.email,
                        subject: `Good Morning ${executive.name} — ${count} Follow-Up${count > 1 ? 's' : ''} Today`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #1B3A5C; padding: 20px; border-radius: 8px 8px 0 0;">
                                    <h2 style="color: white; margin: 0;">Good Morning, ${executive.name}!</h2>
                                    <p style="color: #ccc; margin: 4px 0 0;">Your follow-up schedule for today</p>
                                </div>
                                <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
                                    <p>You have <strong>${count} follow-up${count > 1 ? 's' : ''}</strong> scheduled for today:</p>
                                    <table style="width: 100%; border-collapse: collapse;">
                                        <thead>
                                            <tr style="background: #1B3A5C; color: white;">
                                                <th style="padding: 10px; text-align: left;">Lead</th>
                                                <th style="padding: 10px; text-align: left;">Type</th>
                                                <th style="padding: 10px; text-align: left;">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>${rows}</tbody>
                                    </table>
                                    <p style="margin-top: 20px; color: #666; font-size: 13px;">Have a productive day! — Rising Spaces CRM</p>
                                </div>
                            </div>
                        `,
                    });
                }
            }

            logger.info(`[FollowUp Job] Daily summary sent to ${Object.keys(byExecutive).length} executives`);

        } catch (error) {
            logger.error('[FollowUp Job] Error sending daily summary:', error);
        }
    });
};

// ── Register all follow-up jobs ───────────────────────────────────────────────
export const initFollowUpJobs = () => {
    markMissedFollowUpsJob();
    sendFollowUpRemindersJob();
    dailyFollowUpSummaryJob();
    logger.info('[FollowUp Jobs] All follow-up cron jobs initialized');
};