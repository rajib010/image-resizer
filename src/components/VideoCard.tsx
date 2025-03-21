import React, { useState, useEffect, useCallback } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Download, FileUp, FileDown, Clock } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";
import { Video } from "@prisma/client";
import { Card, CardDescription, CardTitle } from "./ui/card";
import Image from "next/image";
import { Button } from "./ui/button";

dayjs.extend(relativeTime);

interface VideoCardProps {
  video: Video;
  onDownload: (url: string, title: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const getThumbnailUrl = useCallback((publicId: string) => {
    return getCldImageUrl({
      src: publicId,
      width: 400,
      height: 225,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, []);

  const getFullVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 1920,
      height: 1080,
    });
  }, []);

  const getPreviewVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 400,
      height: 225,
      rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"],
    });
  }, []);

  const formatSize = useCallback((size: number) => {
    return filesize(size);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const compressionPercentage = Math.round(
    (1 - Number(video.compressedSize) / Number(video.originalSize)) * 100
  );

  useEffect(() => {
    setPreviewUrl(false);
  }, [isHovered]);

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  return (
    <Card
      className="bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <figure className="aspect-video relative">
        {isHovered ? (
          previewError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <p className="text-red-500">Preview not found</p>
            </div>
          ) : (
            <video
              src={getPreviewVideoUrl(video.publicId)}
              autoPlay
              muted
              loop
              className="w-full h-full object-cover"
              onError={handlePreviewError}
            />
          )
        ) : (
          <Image
            src={getThumbnailUrl(video.publicId)}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}

        <div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
          <Clock size={16} className="mr-1" />
          {formatDuration(video.duration)}
        </div>
      </figure>
      <Card className="card-body p-4">
        <CardTitle className="text-lg font-bold">{video.title}</CardTitle>
        <CardDescription className="text-sm text-base-content opacity-70 mb-4">
          {video.description}
        </CardDescription>
        <CardDescription className="text-sm text-base-content opacity-70 mb-4">
          Uploaded{dayjs(video.createdAt).fromNow()}
        </CardDescription>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-center">
            <FileUp size={18} className="mr-2 text-primary" />
            <div className="font-semibold">Original</div>
            <div>{formatSize(Number(video.originalSize))}</div>
          </div>
        </div>
        <div className="flex items-center">
          <FileDown size={18} className="mr-2 text-secondary" />
          <div className="font-semibold">Compressed</div>
          <div>{formatSize(Number(video.compressedSize))}</div>
        </div>
      </Card>
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm font-semibold">
          Compression:{" "}
          <span className="text-accent">{compressionPercentage}%</span>
        </div>
        <Button
          onClick={() =>
            onDownload(getFullVideoUrl(video.publicId), video.title)
          }
        >
          <Download size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default VideoCard;
