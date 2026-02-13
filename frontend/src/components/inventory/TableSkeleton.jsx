import React from 'react';

const TableSkeleton = () => {
  return (
    [...Array(5)].map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-4 py-4">
          <div className="h-4 bg-gray-300/20 rounded w-6"></div>
        </td>
        <td className="px-4 py-4">
          <div className="h-4 bg-gray-300/20 rounded w-32"></div>
        </td>
        <td className="px-4 py-4">
          <div className="h-4 bg-gray-300/20 rounded w-24"></div>
        </td>
        <td className="px-4 py-4">
          <div className="h-4 bg-gray-300/20 rounded w-20"></div>
        </td>
        <td className="px-4 py-4">
          <div className="h-6 bg-gray-300/20 rounded-full w-20"></div>
        </td>
        <td className="px-4 py-4">
          <div className="h-4 bg-gray-300/20 rounded w-24"></div>
        </td>
        <td className="px-4 py-4">
          <div className="h-4 bg-gray-300/20 rounded w-24"></div>
        </td>
      </tr>
    ))
  );
};

export default TableSkeleton;

