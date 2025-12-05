import { Star } from "@phosphor-icons/react";

interface BookmarkCardProps {
  bookmark: {
    id: string;
    url: string;
    title: string;
    description: string | null;
    favicon: string | null;
    starred: boolean;
    createdAt: Date;
  };
  tags: string[];
  onEdit: () => void;
  onDelete: () => void;
  onArchive?: () => void;
}

export function BookmarkCard({
  bookmark,
  tags,
  onEdit,
  onDelete,
  onArchive,
}: BookmarkCardProps) {
  return (
    <div className="py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <div className="flex items-start gap-2.5">
        {/* Favicon */}
        {bookmark.favicon && (
          <img
            src={bookmark.favicon}
            alt=""
            className="w-4 h-4 mt-1 flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-normal text-gray-900 dark:text-white text-base leading-tight mb-1 flex items-center gap-1.5">
            {bookmark.title}
            {bookmark.starred && (
              <Star
                className="w-4 h-4 text-yellow-500 flex-shrink-0"
                weight="fill"
              />
            )}
          </h3>

          {/* URL */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 block mb-1.5 truncate"
          >
            {bookmark.url}
          </a>

          {/* Description */}
          {bookmark.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 line-clamp-2">
              {bookmark.description}
            </p>
          )}

          {/* Meta info and actions */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {new Date(bookmark.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>•</span>
            <button
              onClick={onEdit}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Edit
            </button>
            {onArchive && (
              <button
                onClick={onArchive}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Archive
              </button>
            )}
            <button
              onClick={onDelete}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
