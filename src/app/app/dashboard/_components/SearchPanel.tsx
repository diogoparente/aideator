"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Search, X, Filter } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Popular subreddits for SaaS and business ideas
const POPULAR_CATEGORIES = [
  "startups",
  "entrepreneur",
  "SaaS",
  "smallbusiness",
  "business",
  "marketing",
  "productivity",
  "technology",
  "programming",
  "webdev",
];

interface SearchPanelProps {
  onSearch: (query: string, categories: string[]) => void;
  searchQuery?: string;
  isLoading?: boolean;
  searching?: boolean;
}

export default function SearchPanel({
  onSearch,
  searchQuery = "",
  isLoading = false,
  searching = false,
}: SearchPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleAddCategory = () => {
    if (newCategory && !selectedCategories.includes(newCategory)) {
      const updatedCategories = [...selectedCategories, newCategory];
      setSelectedCategories(updatedCategories);
      setNewCategory("");
      onSearch(localSearchQuery, updatedCategories);
    }
  };

  const handleRemoveCategory = (category: string) => {
    const updatedCategories = selectedCategories.filter((c) => c !== category);
    setSelectedCategories(updatedCategories);
    onSearch(localSearchQuery, updatedCategories);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];

      onSearch(localSearchQuery, newSelection);
      return newSelection;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      onSearch(localSearchQuery, selectedCategories);
    }
  };

  return (
    <div className="w-full backdrop-blur-sm flex flex-col items-center">
      {/* ChatGPT-style search bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative w-full flex flex-col items-center"
      >
        <div className="w-full max-w-3xl bg-accent  border border-input rounded-full shadow-md">
          <div className="flex items-center w-full">
            <Input
              id="search-query"
              type="text"
              placeholder="Type a topic or business keyword (e.g., productivity, sports, e-mail, health, finance)"
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 px-6 rounded-full placeholder:text-foreground text-ellipsis"
              value={localSearchQuery}
              onChange={handleSearchChange}
            />

            {/* Categories Dropdown Button */}
            <Popover open={showCategories} onOpenChange={setShowCategories}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-12 w-12 p-0"
                  title="Filter by Subreddits"
                >
                  <Filter className="h-5 w-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search subreddits..." />
                  <CommandList>
                    <CommandEmpty>No subreddit found.</CommandEmpty>
                    <CommandGroup heading="Popular Subreddits">
                      {POPULAR_CATEGORIES.map((category) => (
                        <CommandItem
                          key={category}
                          value={category}
                          onSelect={() => toggleCategory(category)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCategories.includes(category)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          r/{category}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="Add Custom">
                      <div className="flex items-center p-2">
                        <Input
                          id="new-category"
                          placeholder="Add subreddit..."
                          className="flex-1 h-8"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCategory();
                            }
                          }}
                        />
                        <Button
                          onClick={handleAddCategory}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-1"
                          disabled={!newCategory}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Search Button */}
            <Button
              type="submit"
              variant={isLoading || searching ? "ghost" : "default"}
              size="sm"
              className={`rounded-full h-12 w-12 p-0 flex items-center justify-center mr-1`}
              disabled={isLoading || searching || !localSearchQuery.trim()}
            >
              {isLoading || searching ? (
                <LoadingSpinner />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Display selected categories */}
      {selectedCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {selectedCategories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="flex items-center gap-1"
            >
              r/{category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveCategory(category)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Optional tips or instructions */}
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {selectedCategories.length > 0
          ? `Filtering by ${selectedCategories.length} subreddits`
          : "Searching all of Reddit"}{" "}
        | Our AI will interpret your input and find relevant Reddit discussions
      </div>
    </div>
  );
}
