export const buildWelcome = (a) => {
  const name     = a.userName || 'there';
  const byThem   = a.breakupInitiator === 'They ended it';
  const byMe     = a.breakupInitiator === 'I ended it';
  const mutual   = a.breakupInitiator === 'It was mutual';
  const feelings = a.currentFeelings || [];
  const fresh    = ['This week', 'This month'].includes(a.timeSinceBreakup);
  const shared   = (a.initialShare || '').trim();

  let msg = `Hey ${name}. I'm really glad you're here.\n\n`;

  if (byThem)
    msg += `Not having a say in it — having someone else make that choice for you — is one of the hardest things. It takes away something bigger than just the relationship.\n\n`;
  else if (byMe)
    msg += `Ending something yourself doesn't make the grief smaller. People often expect it to hurt less when you're the one who decided — but the loss is just as real, and sometimes the guilt makes it heavier.\n\n`;
  else if (mutual)
    msg += `Mutual endings can be some of the most disorienting — when there's no clear villain, no simple story to hold onto. Just an ending. That's its own kind of pain.\n\n`;
  else
    msg += `"Complicated" usually means the feelings are complicated too — and that's completely okay. We can untangle things slowly, together.\n\n`;

  if (feelings.length) {
    const top = feelings.slice(0, 3);
    const str = top.length === 1
      ? top[0].toLowerCase()
      : top.length === 2
        ? `${top[0].toLowerCase()} and ${top[1].toLowerCase()}`
        : `${top[0].toLowerCase()}, ${top[1].toLowerCase()}, and ${top[2].toLowerCase()}`;
    msg += `Feeling ${str} — every bit of that makes sense right now.\n\n`;
  }

  if (fresh)
    msg += `This is really recent. We don't need to figure anything out yet. I'm just here with you.\n\n`;

  if (shared.length) {
    const preview = shared.length > 90 ? shared.slice(0, 90) + '...' : shared;
    msg += `Thank you for sharing that already. I want to make sure I understand it properly before I say anything else.\n\nYou mentioned: "${preview}"\n\nWhat feels hardest about that right now? 💙`;
  } else {
    msg += `There's no pressure and no rush. Tell me — where does it hurt the most today? 💙`;
  }

  return msg;
};
