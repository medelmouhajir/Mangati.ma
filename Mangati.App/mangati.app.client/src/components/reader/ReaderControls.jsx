
// src/components/reader/ReaderControls.jsx
const ReaderControls = ({
    currentPage,
    totalPages,
    onNextPage,
    onPrevPage,
    onPageSelect,
    onToggleSettings
}) => {
    const handlePageChange = (e) => {
        const page = parseInt(e.target.value, 10);
        if (page >= 1 && page <= totalPages) {
            onPageSelect(page - 1); // Convert to 0-based index
        }
    };

    return (
        <div className="reader-controls">
            <button
                onClick={onPrevPage}
                disabled={currentPage === 1}
                className="control-btn prev-btn"
            >
                Previous
            </button>

            <div className="page-indicator">
                <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                />
                <span> / {totalPages}</span>
            </div>

            <button
                onClick={onNextPage}
                disabled={currentPage === totalPages}
                className="control-btn next-btn"
            >
                Next
            </button>

            <button
                onClick={onToggleSettings}
                className="settings-btn"
            >
                Settings
            </button>
        </div>
    );
};

export default ReaderControls;