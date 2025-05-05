# Use the official Python image as a base image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies including TA-Lib dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    gcc \
    g++ \
    make \
    ca-certificates \
    curl \
    git \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install TA-Lib C library from source with explicit paths
RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
    tar -xvzf ta-lib-0.4.0-src.tar.gz && \
    cd ta-lib/ && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    cd .. && \
    rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

# Set LD_LIBRARY_PATH to ensure the shared libraries can be found
ENV LD_LIBRARY_PATH=/usr/lib:/usr/local/lib:$LD_LIBRARY_PATH

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies except TA-Lib
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Install TA-Lib Python wrapper with detailed path specifications
RUN LIBRARY_DIRS=/usr/lib:/usr/local/lib INCLUDE_DIRS=/usr/include:/usr/local/include \
    pip install --no-cache-dir git+https://github.com/TA-Lib/ta-lib-python.git

# Copy the FastAPI app code into the container
COPY . .

# Expose the port FastAPI will run on
EXPOSE 8000

# Set environment variable for production
ENV ENVIRONMENT=production

# Command to run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]