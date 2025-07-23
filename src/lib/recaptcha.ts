export async function verifyRecaptchaV2(token: string): Promise<boolean> {
  try {
    if (!token) {
      console.error('No reCAPTCHA token provided');
      return false;
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY_V2;
    if (!secret) {
      console.error('RECAPTCHA_SECRET_KEY not configured in environment variables');
      return false;
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secret,
        response: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      if (data.challenge_ts) {
        const challengeTime = new Date(data.challenge_ts).getTime();
        const currentTime = Date.now();
        const fiveMinutesInMs = 5 * 60 * 1000;

        if (currentTime - challengeTime > fiveMinutesInMs) {
          console.error('reCAPTCHA token expired');
          return false;
        }
      }
      return true;
    } else {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return false;
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}
