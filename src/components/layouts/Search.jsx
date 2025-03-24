import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { members } from '@/pages/api/members';
import Fuse from 'fuse.js';
import { useMember } from '@/context/MemberContext';
import clsx from 'clsx';

const Search = () => {
  const { setMemberItem } = useMember();
  const listRef = useRef(null);
  
  // Create Fuse instance once with useMemo
  const fuse = useMemo(() => new Fuse(members, {
    threshold: 0.3,
    keys: ['name', 'siteURL', 'year'],
    useExtendedSearch: true,
  }), []);

  // State management
  const [searchResults, setSearchResults] = useState(members.map(member => ({ item: member })));
  const [scrollState, setScrollState] = useState({ isAtBottom: false, isAtTop: true });
  
  // Handle scroll events - memoized with useCallback
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    setScrollState({
      isAtBottom: scrollTop + clientHeight >= scrollHeight - 1, // -1 for rounding errors
      isAtTop: scrollTop < 1
    });
  }, []);

  // Handle search input - memoized with useCallback
  const handleSearch = useCallback((e) => {
    const query = e.target.value;
    const results = query 
      ? fuse.search(query)
      : members.map(member => ({ item: member }));
    
    setSearchResults(results);
    
    // Reset scroll position
    if (listRef.current) {
      listRef.current.scrollTop = 0;
      setScrollState({ isAtBottom: false, isAtTop: true });
    }
  }, [fuse]);

  // URL shortening utility - memoized with useCallback
  const shortenURL = useCallback((url) => {
    if (typeof url !== 'string') {
      console.error('The provided URL is not a string:', url);
      return '';
    }
    return url.replace(/(^\w+:|^)\/\/(www\.)?/, '');
  }, []);

  const { isAtBottom, isAtTop } = scrollState;

  return (
    <section className="grid max-w-[600px] min-w-[300px] min-h-full w-full space-y-4 pt-10">
      {/* Search bar */}
      <div className="flex flex-row-reverse items-stretch font-mono text-lg text-secondary max-h-[44px] min-w-full">
        <Input
          className="h-full peer"
          type="text"
          placeholder="filter by name, year, site ..."
          onChange={handleSearch}
        />
        <span className="px-4 py-2 transition duration-300 bg-black text-stone-700 peer-focus-within:text-yellow-500">
          search&gt;
        </span>
      </div>

      {/* Search results */}
      <ul 
        ref={listRef}
        onScroll={handleScroll}
        className={clsx(
          'pl-6 pb-4 space-y-2 overflow-y-scroll text-white max-h-[300px] min-w-full',
          isAtBottom && 'scroll-at-bottom',
          !isAtTop && 'scroll-not-at-top'
        )}
      >
        {searchResults.map(({ item: member }) => (
          <div key={member.name} className="flex items-center">
            <span className="pr-8 text-yellow-500">&gt;</span>
            <li
              onPointerOver={() => setMemberItem(member)}
              className="px-6 py-2.5 font-mono text-sm border-2 border-dotted border-stone-600 hover:bg-stone-800 hover:cursor-crosshair w-full truncate"
            >
              <span className={member.legacy ? 'text-yellow-700' : ''}>
                {member.name}
              </span>
              &nbsp;|&nbsp;
              <span className="text-yellow-500 underline transition duration-200 hover:text-yellow-600/40">
                <a href={member.siteURL} target="_blank" rel="noreferrer">
                  {shortenURL(member.siteURL)}
                </a>
              </span>
              &nbsp;{!member.legacy ? '|' : ''} {member.year}
            </li>
          </div>
        ))}
      </ul>
    </section>
  );
};

export default Search;