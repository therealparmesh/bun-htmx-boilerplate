import { Elysia, NotFoundError, type Static, t } from 'elysia';
import { html } from '@elysiajs/html';

const Todo = t.Object({
  id: t.String(),
  completed: t.Boolean(),
  content: t.String(),
});

const todos: Static<typeof Todo>[] = [];

function Root({ children }: { children?: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bun + HTMX</title>
        <link rel="icon" href="data:," />
        <script src="https://unpkg.com/htmx.org@2.0.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}

function TodoItem({ id, completed, content }: Static<typeof Todo>) {
  return (
    <li id={`todo-${id}`}>
      <input
        hx-patch={`/todos/${id}`}
        hx-target={`#todo-${id}`}
        hx-swap="outerHTML"
        hx-disabled-elt="this"
        type="checkbox"
        id={`todo-completed-${id}`}
        name="completed"
        checked={completed}
      />
      <label for={`todo-completed-${id}`}>{content}</label>
    </li>
  );
}

new Elysia()
  .use(html())
  .get('/', () => (
    <Root>
      <main>
        <h1>todos</h1>
        <section>
          <form
            hx-post="/todos"
            hx-target="#todo-list-container"
            hx-disabled-elt="#new-todo-content"
            hx-on:htmx-after-request="this.reset()"
          >
            <input
              id="new-todo-content"
              name="content"
              placeholder="What needs to be done?"
              required
            />
          </form>
        </section>
        <section hx-get="/todos" hx-trigger="load" id="todo-list-container" />
      </main>
    </Root>
  ))
  .get('/todos', () => (
    <ul>
      {todos.map((todo) => (
        <TodoItem {...todo} />
      ))}
    </ul>
  ))
  .post(
    '/todos',
    ({ body: { content } }) => {
      todos.push({
        id: String(todos.length + 1),
        completed: false,
        content,
      });

      return (
        <ul>
          {todos.map((todo) => (
            <TodoItem {...todo} />
          ))}
        </ul>
      );
    },
    { body: t.Object({ content: Todo.properties.content }) },
  )
  .patch(
    '/todos/:id',
    ({ params: { id }, body: { completed } }) => {
      const todo = todos.find(({ id: todoId }) => todoId === id);

      if (!todo) {
        throw new NotFoundError();
      }

      todo.completed = completed === 'on';

      return <TodoItem {...todo} />;
    },
    {
      params: t.Object({ id: Todo.properties.id }),
      body: t.Object({ completed: t.Optional(t.Literal('on')) }),
    },
  )
  .listen({}, ({ url: { origin } }) =>
    console.log(`Server is running at ${origin}`),
  );
