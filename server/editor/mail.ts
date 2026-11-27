import { Resend } from 'resend';

export async function sendLoginLink(to: string, link: string, attemptId: string): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY'];
  const from = process.env['EDITOR_FROM'];
  const templateId = process.env['RESEND_TEMPLATE_ID'];
  if (!apiKey || !from || !templateId) {
    throw new Error('missing Resend configuration');
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: 'Tu enlace para editar el portafolio',
    template: {
      id: templateId,
      variables: { LOGIN_LINK: link },
    },
    idempotencyKey: `editor-login/${attemptId}`,
  });

  if (error) {
    throw new Error(`resend ${error.name}: ${error.message}`);
  }
  console.log('login email accepted', data?.id);
}
