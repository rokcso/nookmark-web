import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface BookmarkFormData {
  url: string;
  title: string;
  description: string;
  tags: string;
}

interface BookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: BookmarkFormData;
  onDataChange: (data: BookmarkFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
}

export function BookmarkDialog({
  open,
  onOpenChange,
  title,
  data,
  onDataChange,
  onSubmit,
  isSubmitting,
  isEditing = false,
}: BookmarkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="url"
              className="text-sm font-normal text-gray-700 dark:text-gray-300"
            >
              URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={data.url}
              onChange={(e) => onDataChange({ ...data, url: e.target.value })}
              required
              disabled={isEditing}
              className={`text-sm ${
                isEditing
                  ? "bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                  : ""
              }`}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-normal text-gray-700 dark:text-gray-300"
            >
              Title
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Bookmark Title"
              value={data.title}
              onChange={(e) =>
                onDataChange({ ...data, title: e.target.value })
              }
              required
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="tags"
              className="text-sm font-normal text-gray-700 dark:text-gray-300"
            >
              Tags
            </Label>
            <Input
              id="tags"
              type="text"
              placeholder="Type tags (space to separate)"
              value={data.tags}
              onChange={(e) => onDataChange({ ...data, tags: e.target.value })}
              className="text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Press space to add tags
            </p>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-normal text-gray-700 dark:text-gray-300"
            >
              Description{" "}
              <span className="text-gray-500 dark:text-gray-400">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Add a description for this bookmark..."
              value={data.description}
              onChange={(e) =>
                onDataChange({ ...data, description: e.target.value })
              }
              className="text-sm min-h-[100px] resize-none"
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-sm bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                  ? "Save Changes"
                  : "Add Bookmark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
