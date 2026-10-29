package com.bimlab.ticket.attachment;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Component
public class MinioObjectStore {
    private final MinioClient client;
    private final String bucket;

    MinioObjectStore(MinioClient client, @Value("${app.minio.bucket}") String bucket) {
        this.client = client;
        this.bucket = bucket;
    }

    public String put(UUID ticketId, MultipartFile file) {
        String objectKey = "tickets/" + ticketId + "/" + UUID.randomUUID();
        try (InputStream stream = file.getInputStream()) {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                throw new IllegalStateException("Bucket MinIO chưa được tạo: " + bucket);
            }
            client.putObject(PutObjectArgs.builder().bucket(bucket).object(objectKey)
                    .stream(stream, file.getSize(), -1)
                    .contentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType())
                    .build());
            return objectKey;
        } catch (IllegalStateException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể lưu tệp lên MinIO", exception);
        }
    }

    public byte[] get(String objectKey, long maxBytes) {
        try (InputStream stream = client.getObject(GetObjectArgs.builder().bucket(bucket).object(objectKey).build())) {
            byte[] content = stream.readNBytes(Math.toIntExact(maxBytes + 1));
            if (content.length > maxBytes) throw new IllegalStateException("Tệp vượt giới hạn tải xuống");
            return content;
        } catch (Exception exception) {
            if (exception instanceof IllegalStateException stateException) throw stateException;
            throw new IllegalStateException("Không thể tải tệp từ MinIO", exception);
        }
    }

    public void delete(String objectKey) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể xóa tệp khỏi MinIO", exception);
        }
    }
}
