async function sendResend(to: string, link: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EDITOR_FROM,
      to: [to],
      subject: 'Tu enlace para editar el portafolio',
      text: message(link),
    }),
  });
  if (!response.ok) {
    throw new Error(`resend ${response.status}`);
  }
}

async function sendWeb3(accessKey: string, to: string, link: string): Promise<void> {
  const owner = process.env.EDITOR_EMAIL?.split(/[,;]/)[0]?.trim().toLowerCase();
  const copyDeveloper = Boolean(owner && to !== owner);
  try {
    await postWeb3(accessKey, to, link, copyDeveloper);
  } catch (error) {
    if (!copyDeveloper) {
      throw error;
    }
    // CC is a paid Web3Forms option. Without it, the key owner still receives the link.
    console.error('web3forms copy failed; sending to the form inbox only', error);
    await postWeb3(accessKey, to, link, false);
  }
}

async function postWeb3(accessKey: string, to: string, link: string, copyTo: boolean): Promise<void> {
  const payload: Record<string, string> = {
    access_key: accessKey,
    subject: 'Tu enlace para editar el portafolio',
    from_name: 'Portafolio',
    email: to,
    message: message(link),
    botcheck: '',
  };
  if (copyTo) {
    payload['ccemail'] = to;
  }
  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (!response.ok || !body?.success) {
    throw new Error('web3forms rejected the message');
  }
}

function message(link: string): string {
  return [
    'Hola,',
    '',
    'Usa este enlace para entrar al panel. Funciona una sola vez y vence en 15 minutos.',
    'Ábrelo en el mismo aparato donde lo pediste.',
    '',
    link,
    '',
    'Si no fuiste tú, ignora este correo.',
  ].join('\n');
}

/**
 * Resend when those keys exist. Otherwise Web3Forms, which already delivers to her inbox.
 * The link is generated here; the form only supplies the transport.
 */
export async function sendLoginLink(to: string, link: string, web3Key: string | null): Promise<void> {
  if (process.env.RESEND_API_KEY && process.env.EDITOR_FROM) {
    await sendResend(to, link);
    return;
  }
  if (!web3Key) {
    throw new Error('missing mail transport');
  }
  await sendWeb3(web3Key, to, link);
}
