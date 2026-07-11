import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'node:crypto'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const bucket = process.env.S3_BUCKET_NAME

export async function createUploadUrl(prefix, contentType) {
  const ext = contentType === 'image/png' ? 'png' : 'jpg'
  const key = `${prefix}/${crypto.randomBytes(16).toString('hex')}.${ext}`
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  return { uploadUrl, key, publicUrl }
}

export async function deleteObject(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
