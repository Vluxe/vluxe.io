(function() {
    'use strict';

    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');
    var fuse;
    var searchIndex;

    // Fetch the search index
    fetch('/index.json')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            searchIndex = data;
            // Initialize Fuse.js
            fuse = new Fuse(searchIndex, {
                keys: [
                    { name: 'title', weight: 0.4 },
                    { name: 'summary', weight: 0.3 },
                    { name: 'content', weight: 0.2 },
                    { name: 'tags', weight: 0.1 }
                ],
                includeScore: true,
                includeMatches: true,
                threshold: 0.3,
                minMatchCharLength: 2
            });
        })
        .catch(function(error) {
            console.error('Error loading search index:', error);
        });

    // Debounce function
    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    // Perform search
    function performSearch(query) {
        if (!fuse || !query || query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        var results = fuse.search(query);
        displayResults(results, query);
    }

    // Display results
    function displayResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="no-results">No results found for "' + escapeHtml(query) + '"</p>';
            return;
        }

        var html = '<p class="results-count">' + results.length + ' result' + (results.length === 1 ? '' : 's') + ' found</p>';

        results.forEach(function(result) {
            var item = result.item;
            var tags = '';

            if (item.tags && item.tags.length > 0) {
                tags = '<span class="search-tags">';
                item.tags.forEach(function(tag, index) {
                    if (index > 0) tags += ', ';
                    tags += escapeHtml(tag);
                });
                tags += '</span>';
            }

            html += '<article class="search-result">' +
                '<h2 class="search-result-title"><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h2>' +
                '<p class="search-result-meta">' +
                    '<time>' + item.date + '</time>' +
                    (item.author ? ' &middot; ' + escapeHtml(item.author) : '') +
                    (tags ? ' &middot; ' + tags : '') +
                '</p>' +
                '<p class="search-result-summary">' + escapeHtml(item.summary || '').substring(0, 200) + '...</p>' +
                '</article>';
        });

        searchResults.innerHTML = html;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Listen for input
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            performSearch(e.target.value);
        }, 200));

        // Check for query parameter
        var urlParams = new URLSearchParams(window.location.search);
        var query = urlParams.get('q');
        if (query) {
            searchInput.value = query;
            // Wait for index to load
            var checkIndex = setInterval(function() {
                if (fuse) {
                    performSearch(query);
                    clearInterval(checkIndex);
                }
            }, 100);
        }
    }
})();
