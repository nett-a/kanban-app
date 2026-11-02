import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { persist } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';
import { newId } from '../utils/id.js';
import { getCardForMember } from './access.service.js';
import { logActivity } from './activity.service.js';

const filePath = (storedName) => path.join(env.uploadDir, path.basename(storedName));

export async function removeAttachmentFiles(attachments) {
  await Promise.all(attachments.map((a) => fs.rm(filePath(a.storedName), { force: true })));
}

export async function addAttachment(cardId, userId, file) {
  if (!file) throw AppError.badRequest('No file uploaded (field name must be "file")');
  let card;
  try {
    ({ card } = getCardForMember(cardId, userId));
  } catch (err) {
    await fs.rm(file.path, { force: true });
    throw err;
  }

  const attachment = {
    id: newId(),
    name: path.basename(file.originalname).slice(0, 255),
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: userId,
    createdAt: new Date().toISOString(),
  };
  card.attachments.push(attachment);
  card.updatedAt = attachment.createdAt;
  logActivity({ boardId: card.boardId, cardId: card.id, userId, message: `attached ${attachment.name}` });
  await persist();
  return attachment;
}

export function getAttachmentFile(cardId, attachmentId, userId) {
  const { card } = getCardForMember(cardId, userId);
  const attachment = card.attachments.find((a) => a.id === attachmentId);
  if (!attachment) throw AppError.notFound('Attachment not found');
  return { attachment, absolutePath: filePath(attachment.storedName) };
}

export async function deleteAttachment(cardId, attachmentId, userId) {
  const { card } = getCardForMember(cardId, userId);
  const attachment = card.attachments.find((a) => a.id === attachmentId);
  if (!attachment) throw AppError.notFound('Attachment not found');

  card.attachments = card.attachments.filter((a) => a.id !== attachmentId);
  logActivity({ boardId: card.boardId, cardId: card.id, userId, message: `deleted attachment ${attachment.name}` });
  await persist();
  await removeAttachmentFiles([attachment]);
}
