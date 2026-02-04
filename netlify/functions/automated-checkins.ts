import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Fast! <notifications@fast-fasting-app.netlify.app>';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// This function can be called via a scheduled Netlify function or manually
// To schedule: Add to netlify.toml:
// [functions."automated-checkins"]
// schedule = "0 */4 * * *"  # Every 4 hours

interface CheckinAction {
  userId: string;
  email: string;
  name?: string;
  type: 'long_fast' | 'milestone' | 'inactivity' | 'encouragement' | 'welcome' | 'first_fast';
  title: string;
  message: string;
  fastHours?: number;
}

async function sendInAppNotification(userId: string, title: string, message: string, type: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false,
      });
    return !error;
  } catch {
    return false;
  }
}

async function sendEmail(to: string, subject: string, message: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:30px;text-align:center;">
              <span style="font-size:32px;">🔥</span>
              <h1 style="margin:10px 0 0;color:#fff;font-size:24px;font-weight:800;">Fast!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 15px;color:#333;font-size:20px;">${subject}</h2>
              <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">${message}</p>
              <a href="https://fast-fasting-app.netlify.app/dashboard" style="display:inline-block;padding:14px 28px;background:#22c55e;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Open Fast!</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 30px;background:#f9fafb;text-align:center;border-top:1px solid #e5e5e5;">
              <p style="margin:0;color:#888;font-size:12px;">
                <a href="https://fast-fasting-app.netlify.app" style="color:#22c55e;text-decoration:none;font-weight:600;">Fast!</a> - Track your fasting journey
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text: message,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function handler(event: any) {
  console.log('Running automated check-ins...');

  const actions: CheckinAction[] = [];
  const now = new Date();

  try {
    // 1. Check for long fasts (24h+, 36h+, 48h+, 72h+)
    const { data: activeFasts } = await supabase
      .from('fasting_sessions')
      .select(`
        id, user_id, start_time, target_hours, confirmed_at,
        profiles:user_id (email, name)
      `)
      .is('end_time', null);

    if (activeFasts) {
      for (const fast of activeFasts) {
        const startTime = new Date(fast.start_time).getTime();
        const hours = (now.getTime() - startTime) / (1000 * 60 * 60);
        const profile = fast.profiles as any;

        // Check for milestone achievements
        const milestones = [24, 36, 48, 72];
        for (const milestone of milestones) {
          if (hours >= milestone && hours < milestone + 4) {
            // Check if we already sent a notification for this milestone
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', fast.user_id)
              .like('message', `%${milestone} hour%`)
              .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
              .limit(1);

            if (!existing || existing.length === 0) {
              actions.push({
                userId: fast.user_id,
                email: profile?.email,
                name: profile?.name,
                type: 'milestone',
                title: `🎉 ${milestone} Hour Milestone!`,
                message: `Amazing! You've been fasting for ${milestone} hours! Your body is in deep autophagy and cellular renewal. You're doing incredible things for your health!`,
                fastHours: hours,
              });
            }
          }
        }

        // Check-in for extended fasts (every 8 hours after 24 hours)
        if (hours >= 24) {
          const lastConfirmed = fast.confirmed_at
            ? new Date(fast.confirmed_at).getTime()
            : startTime;
          const hoursSinceConfirm = (now.getTime() - lastConfirmed) / (1000 * 60 * 60);

          if (hoursSinceConfirm >= 8) {
            // Check if we already sent a check-in recently
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', fast.user_id)
              .eq('type', 'reminder')
              .gte('created_at', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString())
              .limit(1);

            if (!existing || existing.length === 0) {
              actions.push({
                userId: fast.user_id,
                email: profile?.email,
                name: profile?.name,
                type: 'long_fast',
                title: `💪 Still going strong?`,
                message: `You've been fasting for ${Math.round(hours)} hours! Just checking in - how are you feeling? Remember to stay hydrated and listen to your body.`,
                fastHours: hours,
              });
            }
          }
        }
      }
    }

    // 2. Welcome messages for new signups (within last 4 hours)
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const { data: newUsers } = await supabase
      .from('profiles')
      .select('id, email, name, created_at')
      .gte('created_at', fourHoursAgo.toISOString());

    if (newUsers) {
      for (const user of newUsers) {
        // Check if we already sent a welcome notification
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .like('title', '%Welcome%')
          .limit(1);

        if (!existing || existing.length === 0) {
          actions.push({
            userId: user.id,
            email: user.email,
            name: user.name,
            type: 'welcome',
            title: `Welcome to Fast! 👋`,
            message: `We're excited to have you on your fasting journey! Start your first fast whenever you're ready - even a 12-16 hour fast can kickstart amazing health benefits. Tap the big green button to begin!`,
          });
        }
      }
    }

    // 3. Congratulate first fast completion
    const { data: recentCompletedFasts } = await supabase
      .from('fasting_sessions')
      .select(`
        id, user_id, start_time, end_time, target_hours,
        profiles:user_id (id, email, name, fasts_completed)
      `)
      .not('end_time', 'is', null)
      .gte('end_time', fourHoursAgo.toISOString());

    if (recentCompletedFasts) {
      for (const fast of recentCompletedFasts) {
        const profile = fast.profiles as any;

        // Only for users who just completed their FIRST fast
        if (profile?.fasts_completed === 1) {
          // Check if we already sent a first-fast notification
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', fast.user_id)
            .like('title', '%first fast%')
            .limit(1);

          if (!existing || existing.length === 0) {
            const hours = fast.end_time && fast.start_time
              ? Math.round((new Date(fast.end_time).getTime() - new Date(fast.start_time).getTime()) / (1000 * 60 * 60))
              : 0;

            actions.push({
              userId: fast.user_id,
              email: profile.email,
              name: profile.name,
              type: 'first_fast',
              title: `🎉 You completed your first fast!`,
              message: `Congratulations! You just finished ${hours} hours of fasting. Your body has already started experiencing the benefits - improved insulin sensitivity, cellular cleanup, and metabolic flexibility. Keep it up!`,
              fastHours: hours,
            });
          }
        }
      }
    }

    // 4. Check for inactive users (haven't fasted in 7+ days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: inactiveUsers } = await supabase
      .from('profiles')
      .select(`
        id, email, name,
        fasting_sessions!inner (end_time)
      `)
      .lt('fasting_sessions.end_time', weekAgo.toISOString())
      .order('fasting_sessions(end_time)', { ascending: false });

    // Filter to users who haven't had any recent activity
    if (inactiveUsers) {
      for (const user of inactiveUsers) {
        // Check if we already sent an inactivity notification this week
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'reminder')
          .gte('created_at', weekAgo.toISOString())
          .limit(1);

        if (!existing || existing.length === 0) {
          actions.push({
            userId: user.id,
            email: user.email,
            name: user.name,
            type: 'inactivity',
            title: `👋 We miss you!`,
            message: `It's been a while since your last fast. Ready to get back on track? Even a short 12-16 hour fast can kickstart your metabolism and boost your energy.`,
          });
        }
      }
    }

    // 5. Execute actions
    let inAppSent = 0;
    let emailsSent = 0;

    for (const action of actions) {
      // Map action type to notification type
      const notificationType =
        action.type === 'milestone' || action.type === 'first_fast' ? 'milestone' :
        action.type === 'welcome' ? 'system' : 'reminder';

      // Always send in-app notification
      const inAppSuccess = await sendInAppNotification(
        action.userId,
        action.title,
        action.message,
        notificationType
      );
      if (inAppSuccess) inAppSent++;

      // Send email for important notifications (milestones, long fasts, welcome, first fast)
      const emailTypes = ['milestone', 'long_fast', 'welcome', 'first_fast'];
      if (action.email && emailTypes.includes(action.type)) {
        const emailSuccess = await sendEmail(action.email, action.title, action.message);
        if (emailSuccess) emailsSent++;
      }
    }

    console.log(`Automated check-ins complete: ${actions.length} actions, ${inAppSent} in-app, ${emailsSent} emails`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        actions: actions.length,
        inAppSent,
        emailsSent,
        timestamp: now.toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Automated check-ins error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
