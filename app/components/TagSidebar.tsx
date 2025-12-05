import { Tag as TagIcon } from "@phosphor-icons/react";
import { TAGS } from "~/lib/constants";

interface TagData {
  tag: {
    id: string;
    name: string;
  };
  count: number;
}

interface TagSidebarProps {
  tags: TagData[];
  activeTag?: string;
  onTagClick: (tagName: string) => void;
  onClearFilter: () => void;
}

export function TagSidebar({
  tags,
  activeTag,
  onTagClick,
  onClearFilter,
}: TagSidebarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TagIcon className="w-4 h-4" weight="bold" />
          Tags
        </h3>
        {activeTag && (
          <button
            onClick={onClearFilter}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {tags.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No tags yet</p>
      ) : (
        <div className="space-y-1.5">
          {tags.slice(0, TAGS.MAX_SIDEBAR_DISPLAY).map((item) => {
            const isActive = activeTag === item.tag.name;
            return (
              <button
                key={item.tag.id}
                onClick={() => onTagClick(item.tag.name)}
                className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded transition-colors text-left group ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="truncate text-xs">{item.tag.name}</span>
                <span
                  className={`text-xs ml-2 flex-shrink-0 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
