/**
 * 할 일(Todo) 관리 객체
 * - 데이터: items 배열에 할 일 객체({ uid, date, title, content })를 담는다.
 * - 저장소: localStorage의 "todos" 키에 JSON 문자열로 저장한다.
 * - 흐름: 데이터 변경(add/update/remove) → save()로 저장 → render()로 화면 다시 그리기
 */
const todo = {
    items: [], // 할 일 목록
    tpl: null, // 할 일 한 개를 그리는 HTML 템플릿 (처음 한 번만 읽어서 보관)
    editUid: null, // 수정 중인 할 일의 uid (null이면 등록 모드)
    cancelBtn: null, // 수정 모드에서만 나타나는 취소 버튼

    /**
     * 할 일 등록
     * - uid는 등록 시각(Date.now())을 써서 항목마다 겹치지 않게 만든다.
     * - 배열에 추가한 뒤 저장하고 목록을 다시 그린다.
     */
    add(date, title, content) { // 할 일 등록

        this.items.push({
            uid: Date.now(),
            date,
            title,
            content
        });

        this.save(); // 저장 처리
        this.render(); // 할 일 등록 후 화면 갱신
    },

    /**
     * 할 일 수정
     * - data-uid로 넘어온 uid는 문자열이라 Number로 바꿔서 비교한다.
     * - find()로 찾은 객체는 배열 안 객체와 같은 참조라서 필드를 바꾸면 배열에도 바로 반영된다.
     */
    update(uid, date, title, content) { // 할 일 수정
        const item = this.items.find(x => x.uid === Number(uid));
        if (!item) return; // 없는 uid면 아무것도 하지 않는다.

        item.date = date;
        item.title = title;
        item.content = content;

        this.save(); // 저장 처리
        this.render(); // 할 일 수정 후 화면 갱신
    },

    /**
     * 할 일 삭제
     * - findIndex()로 위치를 찾고 splice()로 배열에서 한 개만 뺀다.
     * - 수정 중이던 항목을 지우면 양식에 남은 값이 의미가 없어서 등록 모드로 되돌린다.
     */
    remove(uid) { // 할 일 제거

        const index = this.items.findIndex(x => x.uid === Number(uid));
        if (index === -1) return; // 없는 uid면 아무것도 하지 않는다.

        this.items.splice(index, 1);

        // 수정 중이던 할 일을 삭제하면 수정 모드도 종료
        if (this.editUid === Number(uid)) {
            this.resetForm();
        }

        this.save(); // 저장 처리

        this.render(); // 할 일 제거 후 화면 갱신
    },

    /**
     * 수정 모드 시작
     * - 선택한 할 일의 값을 등록 양식에 채우고 editUid에 uid를 기록한다.
     * - editUid가 있으면 제출 시 add 대신 update가 실행된다. (아래 submit 처리 참고)
     */
    startEdit(uid) { // 수정 모드 시작: 선택한 할 일을 양식에 채우기
        const item = this.items.find(x => x.uid === Number(uid));
        if (!item) return;

        this.editUid = item.uid;

        frmTodo.date.value = item.date;
        frmTodo.title.value = item.title;
        frmTodo.content.value = item.content;

        this.updateFormMode();

        // 목록이 길어도 양식이 보이도록 위로 이동
        frmTodo.scrollIntoView({ behavior: "smooth", block: "start" });
        frmTodo.title.focus({ preventScroll: true }); // 스크롤 애니메이션과 겹치지 않게 포커스만 이동
    },

    /**
     * 양식 초기화
     * - 입력값을 비우고 editUid를 null로 바꿔 등록 모드로 돌아간다.
     */
    resetForm() { // 입력 내용 비우고 등록 모드로 되돌리기
        this.editUid = null;

        frmTodo.date.value = "";
        frmTodo.title.value = "";
        frmTodo.content.value = "";

        this.updateFormMode();
    },

    /**
     * 등록/수정 모드에 맞춘 화면 표시
     * - editUid 값 하나로 모드를 판단해서 제출 버튼 문구, 취소 버튼, 강조 표시를 함께 바꾼다.
     * - 목록을 다시 그린 뒤에도 호출해서 강조 표시가 사라지지 않게 한다.
     */
    updateFormMode() { // 등록/수정 모드에 맞게 버튼과 강조 표시 변경
        const isEditing = this.editUid !== null; // 수정 모드 여부

        // 제출 버튼 문구 변경
        const submitBtn = frmTodo.querySelector('button[type="submit"]');
        submitBtn.textContent = isEditing ? "수정하기" : "등록하기";

        // 취소 버튼: 수정 모드일 때만 제출 버튼 아래에 추가
        // cancelBtn에 만든 버튼을 보관해서 중복으로 만들지 않는다.
        if (isEditing && !this.cancelBtn) {
            const btn = document.createElement("button");
            btn.type = "button"; // submit이 아니라서 눌러도 양식이 제출되지 않는다.
            btn.textContent = "취소";
            btn.className = "bg-gray-400 hover:bg-gray-700 py-2 px-5 mt-2 rounded-sm text-white text-lg block mx-auto cursor-pointer max-w-xs w-1/2";
            btn.addEventListener("click", () => {
                this.resetForm();
                frmTodo.title.focus();
            });
            submitBtn.after(btn);
            this.cancelBtn = btn;
        } else if (!isEditing && this.cancelBtn) {
            this.cancelBtn.remove();
            this.cancelBtn = null;
        }

        // 수정 중인 할 일 강조 표시
        // toggle(클래스, 조건)은 조건이 true면 클래스를 붙이고 false면 뗀다.
        const lis = document.querySelectorAll("#todo-items > li");
        for (const li of lis) {
            const isTarget = isEditing && li.id === `item-${this.editUid}`;
            li.classList.toggle("ring-2", isTarget);
            li.classList.toggle("ring-indigo-500", isTarget);
        }
    },

    /**
     * 할 일 저장
     * - localStorage는 문자열만 저장할 수 있어서 JSON.stringify()로 바꿔서 저장한다.
     */
    save() { // 할 일 저장
        localStorage.setItem("todos", JSON.stringify(this.items));
    },

    /**
     * 템플릿 조회
     * - index.html의 <script type="text/html" id="tpl"> 안 HTML을 처음 한 번만 읽고 tpl에 보관한다.
     * - 이후에는 DOM을 다시 조회하지 않고 보관한 문자열을 돌려준다.
     */
    getTpl() {
        if (!this.tpl) {
            this.tpl = document.getElementById("tpl").innerHTML;
        }

        return this.tpl;
    },

    /**
     * 할 일 목록 출력
     * 1. localStorage에서 목록을 읽어 items를 새로 채운다. (새로고침해도 목록 유지)
     * 2. 목록이 비었으면 안내 문구만 보여준다.
     * 3. 항목마다 템플릿의 ${이름} 자리를 실제 값으로 바꿔 HTML 문자열을 만든다.
     * 4. 만든 HTML을 innerHTML로 한 번에 넣어 DOM 조작 횟수를 줄인다.
     */
    render() { // 할 일 목록 출력
        const tmp = localStorage.getItem("todos");
        this.items = typeof tmp === 'string' ? JSON.parse(tmp) : []; // 저장된 값이 없으면 null이라 빈 배열로 시작
        const targetEl = document.getElementById("todo-items");

        if (this.items.length === 0) {
            targetEl.innerHTML = "<li>오늘 해야 할 일은 무엇인가요?</li>";
            return;
        }


        let html = "";
        for (const {uid, date, title, content} of this.items) {
            let tpl = this.getTpl();
            // 정규식의 g 플래그로 같은 자리표시자가 여러 번 있어도 전부 바꾼다.
            tpl = tpl.replace(/\$\{title\}/g, title)
                    .replace(/\$\{content\}/g, content)
                    .replace(/\$\{date\}/g, date)
                    .replace(/\$\{uid\}/g, uid);

            html += tpl;
        }

        targetEl.innerHTML = html;

        // 목록을 다시 그린 뒤에도 수정 중인 항목 강조 유지
        this.updateFormMode();
    },

    /**
     * 목록 버튼 클릭 이벤트 위임
     * - 버튼마다 리스너를 붙이지 않고, 부모인 #todo-items에 리스너 하나만 등록한다.
     * - 버튼 클릭은 이벤트 버블링으로 부모까지 올라오므로 부모에서 한꺼번에 처리할 수 있다.
     * - render()가 innerHTML로 버튼을 새로 만들어도 부모는 그대로라서 다시 등록할 필요가 없다.
     */
    bindEvents() { // 목록 버튼 클릭 이벤트 위임
        const targetEl = document.getElementById("todo-items");

        targetEl.addEventListener("click", (e) => {
            // 버튼 안쪽 요소를 눌러도 가장 가까운 버튼을 찾는다.
            const btn = e.target.closest("button[data-uid]");
            if (!btn || !targetEl.contains(btn)) return; // 버튼이 아닌 곳을 누르면 무시한다.

            const { uid } = btn.dataset; // data-uid 값 (문자열)

            if (btn.classList.contains("delete-action")) { // 삭제 버튼
                if (!confirm('정말 삭제하겠습니까?')) return;
                this.remove(uid);
            } else if (btn.classList.contains("edit-action")) { // 수정 버튼
                this.startEdit(uid);
            }
        });
    }
};


// HTML을 다 읽은 뒤 실행 (head에서 불러온 스크립트라서 DOM이 준비될 때까지 기다린다.)
window.addEventListener("DOMContentLoaded", function() {

    todo.render(); // 최초 로딩 시 이미 등록된 할 일 목록을 출력
    todo.bindEvents(); // 목록 버튼 클릭 이벤트는 최초 로딩 때 한 번만 등록

    /**
     * 양식 제출 처리 (등록/수정 공용)
     * 1. 필수 입력값을 검사하고, 비어 있으면 에러를 던져 alert로 안내한다.
     * 2. editUid가 있으면 수정, 없으면 등록을 실행한다.
     * 3. 끝나면 양식을 비우고 등록 모드로 돌아간다.
     */
    frmTodo.addEventListener("submit", function(e) {
        e.preventDefault(); // 양식의 기본 동작을 차단하여 양식에 제출되는 것 막기

        // 필수 입력 항목과 비었을 때 보여줄 메시지
        const requiredFields = {
            date: "날짜를 선택하세요.",
            title: "할일 제목을 입력하세요.",
            content: "할일 내용을 입력하세요.",
        };
        try {
            // 공백만 입력한 경우도 trim()으로 걸러낸다.
            for (const [key, msg] of Object.entries(requiredFields)) {
                if (!frmTodo[key]?.value?.trim()) {
                    throw new Error(msg);
                }
            }

            const date = frmTodo.date.value.trim();
            const title = frmTodo.title.value.trim();
            const content = frmTodo.content.value.trim();

            if (todo.editUid !== null) { // 수정 모드
                todo.update(todo.editUid, date, title, content);
            } else { // 등록 모드
                todo.add(date, title, content);
            }

            // 등록/수정이 완료 되면 입력 내용 비우고 등록 모드로 복귀
            todo.resetForm();
            frmTodo.title.focus();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
});
