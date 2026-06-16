import pytest


@pytest.mark.asyncio
async def test_list_environments(client):
    response = await client.get("/api/environments")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_environment_not_found(client):
    response = await client.get("/api/environments/nonexistent")
    assert response.status_code == 404
