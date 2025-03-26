import React from "react";
import { RedditPost } from "@/app/[locale]/app/dashboard/page";

interface RedditDiscussionsTableProps {
  posts: RedditPost[];
}

const RedditDiscussionsTable: React.FC<RedditDiscussionsTableProps> = ({
  posts,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subreddit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:underline"
                >
                  {post.title}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{post.subreddit}</td>
              <td className="px-6 py-4 whitespace-nowrap">{post.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RedditDiscussionsTable;
