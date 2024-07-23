ARG function_directory="./cognito/lambda-authorizer"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

# Copy needed files
COPY ./tsconfig.base.json /app/src/
COPY ./types/types.ts /app/src/types/

WORKDIR /app/src/cognito/lambda-authorizer
COPY ${function_directory}/package*.json ${function_directory}/tsconfig.json ./
RUN npm install
COPY ${function_directory}/lambda-authorizer.ts ./
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
RUN rm -rf ${LAMBDA_TASK_ROOT}/types/

WORKDIR ${LAMBDA_TASK_ROOT}/cognito/lambda-authorizer
COPY ${function_directory}/package*.json ./
RUN npm install

CMD ["cognito/lambda-authorizer/lambda-authorizer.handler"]