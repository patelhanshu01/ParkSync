import { useState } from 'react';

const useSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    return { searchTerm, setSearchTerm };
};

export default useSearch;
