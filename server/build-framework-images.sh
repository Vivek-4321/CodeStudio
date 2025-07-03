#!/bin/bash

# Final Fixed Build and Push Framework Images to Docker Hub
# Registry: vivekvenugopal513071
# Fixed working directory and file creation issues
# Fixed Solid.js Vite version conflict

set -e

# Configuration
DOCKER_REGISTRY="vivekvenugopal513071"
BASE_TAG="vite-framework"
DOCKER_BUILDKIT=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Framework configurations (excluding problematic Qwik for now)
declare -A FRAMEWORKS=(
    ["react"]="⚛️ React"
    ["react-ts"]="⚛️ React TypeScript" 
    ["vue"]="🟢 Vue.js"
    ["vue-ts"]="🟢 Vue.js TypeScript"
    ["svelte"]="🧡 Svelte"
    ["svelte-ts"]="🧡 Svelte TypeScript"
    ["preact"]="💜 Preact"
    ["preact-ts"]="💜 Preact TypeScript"
    ["solid"]="🔷 Solid.js"
    ["solid-ts"]="🔷 Solid.js TypeScript"
    ["lit"]="🔥 Lit"
    ["lit-ts"]="🔥 Lit TypeScript"
    ["vanilla"]="🍦 Vanilla JavaScript"
    ["vanilla-ts"]="🍦 Vanilla TypeScript"
)

# Create build directory
BUILD_DIR="./docker-builds"
SCRIPT_DIR="$(pwd)"
mkdir -p $BUILD_DIR

echo -e "${BLUE}🚀 Starting Docker image builds for all frameworks${NC}"
echo -e "${CYAN}📋 Registry: ${DOCKER_REGISTRY}${NC}"
echo -e "${CYAN}📋 Base Tag: ${BASE_TAG}${NC}"
echo -e "${CYAN}📋 Working Frameworks: ${#FRAMEWORKS[@]}${NC}"
echo -e "${CYAN}📋 Script Dir: ${SCRIPT_DIR}${NC}"
echo -e "${CYAN}📋 Build Dir: ${BUILD_DIR}${NC}"

# Function to test if a Vite template works
test_vite_template() {
    local framework=$1
    local test_dir="test_${framework}_$(date +%s)"
    local current_dir=$(pwd)
    
    echo -e "${CYAN}🧪 Testing Vite template: ${framework}${NC}"
    
    cd $BUILD_DIR
    
    # Special handling for solid frameworks due to Vite version conflicts
    if [[ "$framework" == "solid" || "$framework" == "solid-ts" ]]; then
        if npm create vite@latest "$test_dir" -- --template "$framework" >/dev/null 2>&1; then
            cd "$test_dir"
            if npm install --legacy-peer-deps >/dev/null 2>&1; then
                cd ..
                rm -rf "$test_dir"
                cd "$current_dir"
                echo -e "${GREEN}✅ Template ${framework} works with --legacy-peer-deps${NC}"
                return 0
            else
                cd ..
                rm -rf "$test_dir" 2>/dev/null || true
                cd "$current_dir"
                echo -e "${RED}❌ Template ${framework} failed even with --legacy-peer-deps${NC}"
                return 1
            fi
        else
            rm -rf "$test_dir" 2>/dev/null || true
            cd "$current_dir"
            echo -e "${RED}❌ Template ${framework} creation failed${NC}"
            return 1
        fi
    else
        if npm create vite@latest "$test_dir" -- --template "$framework" >/dev/null 2>&1; then
            rm -rf "$test_dir"
            cd "$current_dir"
            echo -e "${GREEN}✅ Template ${framework} works${NC}"
            return 0
        else
            rm -rf "$test_dir" 2>/dev/null || true
            cd "$current_dir"
            echo -e "${RED}❌ Template ${framework} failed${NC}"
            return 1
        fi
    fi
}

# Function to create shared scripts
create_shared_scripts() {
    echo -e "${YELLOW}📝 Creating shared scripts...${NC}"
    
    # Create configure-project script
    cat > "$BUILD_DIR/configure-project.sh" << 'EOF'
#!/bin/bash
set -e

# Dynamic project configuration based on environment variables
PROJECT_NAME=${PROJECT_NAME:-"vite-project"}
DEPLOYMENT_ID=${DEPLOYMENT_ID:-"localhost"}
FRAMEWORK=${FRAMEWORK:-"react"}
PROJECT_DIR="/app/${DEPLOYMENT_ID}"

echo "🔧 Configuring ${FRAMEWORK} project: ${PROJECT_NAME}"
echo "📁 Deployment ID: ${DEPLOYMENT_ID}"
echo "📁 Project Directory: ${PROJECT_DIR}"

# Copy template to project directory
if [ -d "/app/template-project" ]; then
    cp -r /app/template-project ${PROJECT_DIR}
    cd ${PROJECT_DIR}
else
    echo "❌ Template project not found, creating new one..."
    mkdir -p ${PROJECT_DIR}
    cd ${PROJECT_DIR}
    
    # Clear any existing files to avoid "directory not empty" prompt
    rm -rf * .[^.]*  2>/dev/null || true
    
    # Special handling for svelte frameworks due to Vite version conflicts
    if [[ "${FRAMEWORK}" == "svelte" || "${FRAMEWORK}" == "svelte-ts" ]]; then
        echo "🔧 Creating Svelte project with legacy peer deps support..."
        npm create vite@latest . -- --template ${FRAMEWORK}
        # Fix Vite version conflict by using legacy peer deps
        npm install --legacy-peer-deps
    # Special handling for solid frameworks due to Vite version conflicts
    elif [[ "${FRAMEWORK}" == "solid" || "${FRAMEWORK}" == "solid-ts" ]]; then
        echo "🔧 Creating Solid.js project with legacy peer deps support..."
        npm create vite@latest . -- --template ${FRAMEWORK}
        npm install --legacy-peer-deps
    else
        npm create vite@latest . -- --template ${FRAMEWORK}
        npm install
    fi
fi

# Update package.json with project name
if command -v jq >/dev/null 2>&1; then
    jq --arg name "${PROJECT_NAME}" '.name = $name' package.json > package.json.tmp && mv package.json.tmp package.json
else
    sed -i "s/\"name\": \".*\"/\"name\": \"${PROJECT_NAME}\"/" package.json
fi

# Create dynamic vite.config.js based on framework
case "${FRAMEWORK}" in
    "react"|"react-ts")
        cat > vite.config.js << VITE_EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '${DEPLOYMENT_ID}.koolify.site',
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __DEPLOYMENT_URL__: JSON.stringify('https://${DEPLOYMENT_ID}.koolify.site'),
    __PROJECT_NAME__: JSON.stringify('${PROJECT_NAME}'),
    __FRAMEWORK__: JSON.stringify('${FRAMEWORK}')
  }
})
VITE_EOF
        ;;
    "vue"|"vue-ts")
        cat > vite.config.js << VITE_EOF
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '${DEPLOYMENT_ID}.koolify.site',
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __DEPLOYMENT_URL__: JSON.stringify('https://${DEPLOYMENT_ID}.koolify.site'),
    __PROJECT_NAME__: JSON.stringify('${PROJECT_NAME}'),
    __FRAMEWORK__: JSON.stringify('${FRAMEWORK}')
  }
})
VITE_EOF
        ;;
    "svelte"|"svelte-ts")
        cat > vite.config.js << VITE_EOF
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '${DEPLOYMENT_ID}.koolify.site',
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __DEPLOYMENT_URL__: JSON.stringify('https://${DEPLOYMENT_ID}.koolify.site'),
    __PROJECT_NAME__: JSON.stringify('${PROJECT_NAME}'),
    __FRAMEWORK__: JSON.stringify('${FRAMEWORK}')
  }
})
VITE_EOF
        ;;
    "preact"|"preact-ts")
        cat > vite.config.js << VITE_EOF
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '${DEPLOYMENT_ID}.koolify.site',
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __DEPLOYMENT_URL__: JSON.stringify('https://${DEPLOYMENT_ID}.koolify.site'),
    __PROJECT_NAME__: JSON.stringify('${PROJECT_NAME}'),
    __FRAMEWORK__: JSON.stringify('${FRAMEWORK}')
  }
})
VITE_EOF
        ;;
    "solid"|"solid-ts")
        cat > vite.config.js << VITE_EOF
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '${DEPLOYMENT_ID}.koolify.site',
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __DEPLOYMENT_URL__: JSON.stringify('https://${DEPLOYMENT_ID}.koolify.site'),
    __PROJECT_NAME__: JSON.stringify('${PROJECT_NAME}'),
    __FRAMEWORK__: JSON.stringify('${FRAMEWORK}')
  }
})
VITE_EOF
        ;;
    "lit"|"lit-ts")
        cat > vite.config.js << VITE_EOF
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '${DEPLOYMENT_ID}.koolify.site',
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __DEPLOYMENT_URL__: JSON.stringify('https://${DEPLOYMENT_ID}.koolify.site'),
    __PROJECT_NAME__: JSON.stringify('${PROJECT_NAME}'),
    __FRAMEWORK__: JSON.stringify('${FRAMEWORK}')
  }
})
VITE_EOF
        ;;
    "vanilla"|"vanilla-ts")
        cat > vite.config.js << VITE_EOF
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '${DEPLOYMENT_ID}.koolify.site',
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    __DEPLOYMENT_URL__: JSON.stringify('https://${DEPLOYMENT_ID}.koolify.site'),
    __PROJECT_NAME__: JSON.stringify('${PROJECT_NAME}'),
    __FRAMEWORK__: JSON.stringify('${FRAMEWORK}')
  }
})
VITE_EOF
        ;;
esac

echo "✅ Project configured successfully!"
echo "📁 Working directory: $(pwd)"
echo "🔧 Vite config created for ${FRAMEWORK}"
echo "🌐 HMR host: ${DEPLOYMENT_ID}.koolify.site"
EOF

    # Create startup script
    cat > "$BUILD_DIR/startup.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting framework container..."
echo "Framework: ${FRAMEWORK}"
echo "Project Name: ${PROJECT_NAME}"
echo "Deployment ID: ${DEPLOYMENT_ID}"

# Configure the project with environment variables
/usr/local/bin/configure-project.sh

# Change to project directory
cd "/app/${DEPLOYMENT_ID}"

echo "📋 Project structure:"
ls -la

echo "📦 Package.json info:"
cat package.json | head -20

# Create log file
touch /tmp/vite-dev.log

echo "✅ Container ready for development!"
echo "🔥 To start dev server, run: npm run dev"
echo "🌐 Will be available at: https://${DEPLOYMENT_ID}.koolify.site"

# Keep container running
echo "📡 Container ready - waiting for commands..."
while true; do
    sleep 30
    if pgrep -f "npm run dev" > /dev/null; then
        echo "$(date): ${FRAMEWORK} dev server is running"
    elif pgrep -f "vite" > /dev/null; then
        echo "$(date): Vite process detected"
    else
        echo "$(date): Container ready for ${FRAMEWORK} dev server startup"
    fi
done
EOF

    echo -e "${GREEN}✅ Shared scripts created${NC}"
}

# Function to build and push image with fixed paths
build_and_push_image() {
    local framework=$1
    local framework_name=$2
    local image_tag="${DOCKER_REGISTRY}/${BASE_TAG}:${framework}"
    local current_dir=$(pwd)
    
    echo -e "${PURPLE}🔨 Building ${framework_name} (${framework})${NC}"
    
    # Test the template first
    if ! test_vite_template "$framework"; then
        echo -e "${RED}❌ Skipping ${framework} due to template issues${NC}"
        return 1
    fi
    
    # Ensure we're in the right directory
    cd "$SCRIPT_DIR"
    
    # Create Dockerfile for this framework
    echo -e "${YELLOW}📝 Creating Dockerfile for ${framework}${NC}"
    
    # Special handling for frameworks that need legacy peer deps
    if [[ "$framework" == "solid" || "$framework" == "solid-ts" || "$framework" == "svelte" || "$framework" == "svelte-ts" ]]; then
        cat > "$BUILD_DIR/Dockerfile.${framework}" << EOF
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \\
    bash \\
    curl \\
    git \\
    python3 \\
    make \\
    g++ \\
    && rm -rf /var/cache/apk/*

# Install global dependencies
RUN npm install -g npm@latest

# Copy configuration scripts first
COPY configure-project.sh /usr/local/bin/configure-project.sh
COPY startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/configure-project.sh /usr/local/bin/startup.sh

# Create and setup template project with legacy peer deps for frameworks that need it
RUN npm create vite@latest template-project -- --template ${framework} && \\
    cd template-project && \\
    npm install --legacy-peer-deps && \\
    ls -la

# Environment variables - including NPM legacy peer deps for compatibility
ENV NODE_ENV=development
ENV FRAMEWORK=${framework}
ENV TERM=xterm-256color
ENV FORCE_COLOR=3
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD ps aux | grep -v grep | grep -q node || exit 0

# Use startup script as entrypoint
ENTRYPOINT ["/usr/local/bin/startup.sh"]
EOF
    else
        cat > "$BUILD_DIR/Dockerfile.${framework}" << EOF
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \\
    bash \\
    curl \\
    git \\
    python3 \\
    make \\
    g++ \\
    && rm -rf /var/cache/apk/*

# Install global dependencies
RUN npm install -g npm@latest

# Copy configuration scripts first
COPY configure-project.sh /usr/local/bin/configure-project.sh
COPY startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/configure-project.sh /usr/local/bin/startup.sh

# Create and setup template project
RUN npm create vite@latest template-project -- --template ${framework} && \\
    cd template-project && \\
    npm install && \\
    ls -la

# Environment variables
ENV NODE_ENV=development
ENV FRAMEWORK=${framework}
ENV TERM=xterm-256color
ENV FORCE_COLOR=3

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD ps aux | grep -v grep | grep -q node || exit 0

# Use startup script as entrypoint
ENTRYPOINT ["/usr/local/bin/startup.sh"]
EOF
    fi
    
    # Verify Dockerfile was created
    if [ ! -f "$BUILD_DIR/Dockerfile.${framework}" ]; then
        echo -e "${RED}❌ Failed to create Dockerfile for ${framework}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Dockerfile created: $BUILD_DIR/Dockerfile.${framework}${NC}"
    
    # Build Docker image with error handling
    echo -e "${CYAN}🐳 Building Docker image: ${image_tag}${NC}"
    
    cd $BUILD_DIR
    
    if docker build -f "Dockerfile.${framework}" -t "${image_tag}" . --no-cache; then
        echo -e "${GREEN}✅ Successfully built: ${image_tag}${NC}"
        
        # Push to Docker Hub
        echo -e "${CYAN}📤 Pushing to Docker Hub...${NC}"
        if docker push "${image_tag}"; then
            echo -e "${GREEN}✅ Successfully pushed: ${image_tag}${NC}"
            cd "$current_dir"
            return 0
        else
            echo -e "${RED}❌ Failed to push: ${image_tag}${NC}"
            cd "$current_dir"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to build: ${image_tag}${NC}"
        cd "$current_dir"
        return 1
    fi
}

# Main execution
main() {
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    
    # Check if logged in to Docker Hub
    if ! docker info | grep -q "Username"; then
        echo -e "${YELLOW}⚠️  Please login to Docker Hub first:${NC}"
        echo -e "${CYAN}docker login${NC}"
        exit 1
    fi
    
    # Create shared scripts
    create_shared_scripts
    
    # Track success/failure
    local total=${#FRAMEWORKS[@]}
    local current=0
    local successful=0
    local failed=0
    declare -a failed_frameworks
    declare -a successful_frameworks
    
    echo -e "${BLUE}📋 Starting build process for ${total} frameworks${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Build and push all framework images
    for framework in "${!FRAMEWORKS[@]}"; do
        current=$((current + 1))
        echo -e "${BLUE}[${current}/${total}] Processing ${FRAMEWORKS[$framework]}${NC}"
        
        if build_and_push_image "$framework" "${FRAMEWORKS[$framework]}"; then
            successful=$((successful + 1))
            successful_frameworks+=("$framework")
            echo -e "${GREEN}✅ Completed ${framework} (${current}/${total})${NC}"
        else
            failed=$((failed + 1))
            failed_frameworks+=("$framework")
            echo -e "${RED}❌ Failed ${framework} (${current}/${total})${NC}"
        fi
        
        echo ""
    done
    
    # Summary
    echo -e "${BLUE}📊 Build Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Successful: ${successful}/${total}${NC}"
    echo -e "${RED}❌ Failed: ${failed}/${total}${NC}"
    
    if [ ${#failed_frameworks[@]} -gt 0 ]; then
        echo -e "${YELLOW}📋 Failed frameworks:${NC}"
        for fw in "${failed_frameworks[@]}"; do
            echo -e "${RED}   - ${fw}${NC}"
        done
    fi
    
    if [ ${#successful_frameworks[@]} -gt 0 ]; then
        echo -e "${YELLOW}📝 Successfully built images:${NC}"
        for fw in "${successful_frameworks[@]}"; do
            echo -e "${CYAN}   ${DOCKER_REGISTRY}/${BASE_TAG}:${fw}${NC}"
        done
    fi
    
    echo -e "${CYAN}📋 Registry: ${DOCKER_REGISTRY}${NC}"
    echo -e "${CYAN}📋 Base tag: ${BASE_TAG}${NC}"
    
    # Create docker-compose.yml for testing successful builds
    if [ ${#successful_frameworks[@]} -gt 0 ]; then
        echo -e "${PURPLE}📝 Creating docker-compose.yml for testing...${NC}"
        
        cat > docker-compose.test.yml << COMPOSE_EOF
version: '3.8'
services:
COMPOSE_EOF

        local port=3001
        for fw in "${successful_frameworks[@]}"; do
            cat >> docker-compose.test.yml << COMPOSE_EOF
  ${fw}-test:
    image: ${DOCKER_REGISTRY}/${BASE_TAG}:${fw}
    ports:
      - "${port}:5173"
    environment:
      - PROJECT_NAME=test-${fw}
      - DEPLOYMENT_ID=test-${fw}
      - FRAMEWORK=${fw}
    
COMPOSE_EOF
            ((port++))
        done
        
        echo -e "${GREEN}✅ Test docker-compose.yml created${NC}"
        echo -e "${CYAN}🧪 To test successful builds: docker-compose -f docker-compose.test.yml up${NC}"
    fi
    
    if [ $successful -eq $total ]; then
        echo -e "${GREEN}🎉 All framework images built and pushed successfully!${NC}"
        exit 0
    elif [ $successful -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Partial success: ${successful} out of ${total} frameworks completed${NC}"
        echo -e "${CYAN}💡 You can now update your server.js to use the successful images${NC}"
        exit 0
    else
        echo -e "${RED}❌ No frameworks were successfully built${NC}"
        exit 1
    fi
}

# Cleanup on exit
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    cd "$SCRIPT_DIR"
    # Don't remove build dir completely as we might want to debug
    # rm -rf $BUILD_DIR 2>/dev/null || true
}

trap cleanup EXIT

# Run main function
main "$@"