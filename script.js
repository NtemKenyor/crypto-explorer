document.addEventListener('DOMContentLoaded', () => {
    const tokenListElement = document.getElementById('token-list');
    const tokenDetailsElement = document.getElementById('token-details');
    const tokenChartElement = document.getElementById('token-chart').getContext('2d');
    let tokenChart;
    let currentTokenId = '';

    const showSpinner = () => {
        const spinner = document.createElement('div');
        spinner.id = 'spinner';
        spinner.innerHTML = `
            <div class="spinner-overlay">
                <div class="spinner"></div>
            </div>
        `;
        document.body.appendChild(spinner);
    };

    const hideSpinner = () => {
        const spinner = document.getElementById('spinner');
        if (spinner) spinner.remove();
    };

    const fetchTokens = async () => {
        showSpinner();
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd');
            const tokens = await response.json();
            displayTokens(tokens);
        } catch (error) {
            console.error('Error fetching tokens:', error);
        } finally {
            hideSpinner();
        }
    };

    const displayTokens = (tokens) => {
        tokens.forEach(token => {
            const li = document.createElement('li');
            li.innerHTML = `<img src="${token.image}" alt="${token.name}" width="20"> ${token.name}`;
            li.onclick = () => {
                currentTokenId = token.id;
                fetchTokenDetails(token.id);
            };
            tokenListElement.appendChild(li);
        });
    };

    const fetchTokenDetails = async (tokenId) => {
        showSpinner();
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}`);
            const token = await response.json();
            displayTokenDetails(token);
            fetchTokenMarketChart(tokenId, '7'); // Default to 7 days
        } catch (error) {
            console.error('Error fetching token details:', error);
        } finally {
            hideSpinner();
        }
    };

    const displayTokenDetails = (token) => {
        tokenDetailsElement.innerHTML = `
            <h2>${token.name}</h2>
            <p>Current Price: $${token.market_data.current_price.usd}</p>
            <p>Market Cap: $${token.market_data.market_cap.usd.toLocaleString()}</p>
            <p>24h High: $${token.market_data.high_24h.usd}</p>
            <p>24h Low: $${token.market_data.low_24h.usd}</p>
            <p>Total Volume: $${token.market_data.total_volume.usd.toLocaleString()}</p>
        `;
    };

    const fetchTokenMarketChart = async (tokenId, days) => {
        showSpinner();
        try {
            let url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
            if (days === 'max') {
                url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=max`;
            }
            const response = await fetch(url);
            const marketChart = await response.json();
            if (!marketChart.prices) {
                throw new Error('Prices data is missing');
            }
            displayTokenChart(marketChart);
        } catch (error) {
            console.error('Error fetching token market chart:', error);
            tokenDetailsElement.innerHTML += `<p>No price data available for the selected period.</p>`;
            if (tokenChart) tokenChart.destroy(); // Clear the previous chart if it exists
        } finally {
            hideSpinner();
        }
    };

    const displayTokenChart = (marketChart) => {
        if (!marketChart.prices) {
            console.error('Prices data is missing in the market chart response');
            return;
        }

        const prices = marketChart.prices.map(price => ({
            x: new Date(price[0]),
            y: price[1]
        }));

        if (tokenChart) tokenChart.destroy();
        tokenChart = new Chart(tokenChartElement, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Price',
                    data: prices,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    };


    // Handle time range buttons
    const timeButtons = document.querySelectorAll('.time-buttons button');
    timeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const days = button.getAttribute('data-days');
            if (currentTokenId) {
                fetchTokenMarketChart(currentTokenId, days);
            }
        });
    });

    fetchTokens();
});
