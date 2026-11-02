import { INLINE_IMAGE_TYPES } from '../config/constants.js';
import * as attachmentService from '../services/attachment.service.js';
import * as cardService from '../services/card.service.js';
import * as commentService from '../services/comment.service.js';

export function createCard(req, res) {
  res.status(201).json({ card: cardService.createCard(req.params.listId, req.user.id, req.body) });
}

export function getCard(req, res) {
  res.json({ card: cardService.getCardDetail(req.params.cardId, req.user.id) });
}

export function updateCard(req, res) {
  res.json({ card: cardService.updateCard(req.params.cardId, req.user.id, req.body) });
}

export function moveCard(req, res) {
  res.json({ card: cardService.moveCard(req.params.cardId, req.user.id, req.body) });
}

export async function deleteCard(req, res) {
  await cardService.deleteCard(req.params.cardId, req.user.id);
  res.status(204).end();
}

/* Checklists */

export function addChecklist(req, res) {
  res.status(201).json({ checklist: cardService.addChecklist(req.params.cardId, req.user.id, req.body) });
}

export function updateChecklist(req, res) {
  const { cardId, checklistId } = req.params;
  res.json({ checklist: cardService.updateChecklist(cardId, checklistId, req.user.id, req.body) });
}

export function deleteChecklist(req, res) {
  cardService.deleteChecklist(req.params.cardId, req.params.checklistId, req.user.id);
  res.status(204).end();
}

export function addChecklistItem(req, res) {
  const { cardId, checklistId } = req.params;
  res.status(201).json({ item: cardService.addChecklistItem(cardId, checklistId, req.user.id, req.body) });
}

export function updateChecklistItem(req, res) {
  const { cardId, checklistId, itemId } = req.params;
  res.json({ item: cardService.updateChecklistItem(cardId, checklistId, itemId, req.user.id, req.body) });
}

export function deleteChecklistItem(req, res) {
  const { cardId, checklistId, itemId } = req.params;
  cardService.deleteChecklistItem(cardId, checklistId, itemId, req.user.id);
  res.status(204).end();
}

/* Comments */

export function addComment(req, res) {
  res.status(201).json({ comment: commentService.addComment(req.params.cardId, req.user.id, req.body) });
}

export function updateComment(req, res) {
  res.json({ comment: commentService.updateComment(req.params.commentId, req.user.id, req.body) });
}

export function deleteComment(req, res) {
  commentService.deleteComment(req.params.commentId, req.user.id);
  res.status(204).end();
}

/* Attachments */

export async function addAttachment(req, res) {
  const attachment = await attachmentService.addAttachment(req.params.cardId, req.user.id, req.file);
  res.status(201).json({ attachment });
}

export function downloadAttachment(req, res) {
  const { attachment, absolutePath } = attachmentService.getAttachmentFile(
    req.params.cardId,
    req.params.attachmentId,
    req.user.id,
  );
  const inline = req.query.inline === '1' && INLINE_IMAGE_TYPES.has(attachment.mimeType);
  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
  res.attachment(attachment.name);
  if (inline) res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.name)}"`);
  res.sendFile(absolutePath, (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: { message: 'File not found' } });
  });
}

export async function deleteAttachment(req, res) {
  await attachmentService.deleteAttachment(req.params.cardId, req.params.attachmentId, req.user.id);
  res.status(204).end();
}
