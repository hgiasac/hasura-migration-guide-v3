FROM denoland/deno

EXPOSE 4200

WORKDIR /app

ADD . /app

RUN deno cache main.ts

CMD ["run", "--allow-net", "main.ts"]